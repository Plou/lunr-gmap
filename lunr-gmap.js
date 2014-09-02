;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var Filters, Gmap, LunrGmap, Marker, Popin, Search,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Gmap = require('./Gmap.coffee');

  Search = require('./Search.coffee');

  Popin = require('./Popin.coffee');

  Filters = require('./Filters.coffee');

  Marker = void 0;

  module.exports = LunrGmap = (function() {
    function LunrGmap(selector) {
      var _this = this;
      this.selector = selector;
      this.getMarkersFromRefs = __bind(this.getMarkersFromRefs, this);
      this.displayMarkersFromRefs = __bind(this.displayMarkersFromRefs, this);
      this.loader = {
        map: false,
        feed: false
      };
      this.templates = {
        single: "",
        list: ""
      };
      this.$el = $(this.selector);
      this.templates.single = this.$el.attr('data-templateSingle');
      this.templates.list = this.$el.attr('data-templateList');
      this.fields = this.parseFields(this.$el.attr('data-lunr'));
      this.filter = this.$el.attr('data-filter');
      this.initGmap();
      this.popin = new Popin(this.selector);
      $.get(this.$el.attr('data-feed')).done(function(data) {
        _this.feed = data;
        _this.initFeed();
        return _this.initFilters();
      });
      $.get(this.templates.single).done(function(data) {
        return _this.templates.single = _.template(data);
      });
      $.get(this.templates.list).done(function(data) {
        return _this.templates.list = _.template(data);
      });
    }

    LunrGmap.prototype.initGmap = function() {
      var _this = this;
      this.map = new Gmap(this.selector, this.$el.attr('data-latitude'), this.$el.attr('data-longitude'), parseInt(this.$el.attr('data-zoom')));
      this.map.$el.on("load", function() {
        _this.loader.map = true;
        Marker = require('./Marker.coffee');
        if (_this.loader.feed) {
          _this.addMarkers(_this.feed);
        }
        return google.maps.event.addListener(_this.map.gmap, 'search.changed', function(result) {
          if (result[1] === "index") {
            return _this.displayMarkersFromRefs(result[0]);
          }
        });
      });
      return this;
    };

    LunrGmap.prototype.initFeed = function() {
      var _this = this;
      this.loader.feed = true;
      if (this.loader.map) {
        this.addMarkers(this.feed);
      }
      this.search = new Search(this.selector, this.feed, this.fields);
      this.search.$el.on("search.change", function(e, data) {
        return google.maps.event.trigger(_this.map.gmap, "search.changed", [data.refs, "index"]);
      });
      return this;
    };

    LunrGmap.prototype.initFilters = function() {
      var _this = this;
      this.filters = new Filters(this.selector, this.feed, this.filter, this.$el.attr('data-templateFilters'));
      return this.filters.$el.on("search.change", function(e, data) {
        return google.maps.event.trigger(_this.map.gmap, "search.changed", [data.filter, _this.filter]);
      });
    };

    LunrGmap.prototype.addMarkers = function(data) {
      var marker, _i, _len;
      this.markers = new Array;
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        marker = data[_i];
        this.addMarker(marker);
      }
      return this;
    };

    LunrGmap.prototype.addMarker = function(data) {
      var marker,
        _this = this;
      data.position = new google.maps.LatLng(data.latitude, data.longitude);
      data.map = this.map.gmap;
      marker = new Marker(data);
      this.markers.push(marker);
      google.maps.event.addListener(marker, 'click', function() {
        return _this.displaySingle(marker);
      });
      return this;
    };

    LunrGmap.prototype.displaySingle = function(marker) {
      this.popin.setContent(this.templates.single(marker));
      return this;
    };

    LunrGmap.prototype.displayList = function(markers) {
      this.popin.setContent(this.templates.list({
        markers: markers
      }));
      return this;
    };

    LunrGmap.prototype.displayMarkersFromRefs = function(result) {
      this.displayList(this.getMarkersFromRefs(result));
      return this;
    };

    LunrGmap.prototype.parseFields = function(data) {
      var field, fields, _i, _len, _ref;
      fields = new Array();
      _ref = data.split(',');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        field = field.split('|');
        fields.push([field[0], parseInt(field[1])]);
      }
      return fields;
    };

    LunrGmap.prototype.getMarkersFromRefs = function(result) {
      var index, markers, _i, _len;
      markers = new Array();
      if (result.length) {
        for (_i = 0, _len = result.length; _i < _len; _i++) {
          index = result[_i];
          markers.push(this.markers[index]);
        }
      }
      return markers;
    };

    return LunrGmap;

  })();

  window.LunrGmap = LunrGmap;

}).call(this);


},{"./Gmap.coffee":2,"./Search.coffee":3,"./Popin.coffee":4,"./Filters.coffee":5,"./Marker.coffee":6}],2:[function(require,module,exports){
(function() {
  var Gmap,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Gmap = (function() {
    function Gmap(parent, latitude, longitude, zoom) {
      this.latitude = latitude;
      this.longitude = longitude;
      this.zoom = zoom;
      this.create = __bind(this.create, this);
      this.id = 'map-canvas-' + (new Date().getTime());
      $(parent).append('<div id="' + this.id + '" class="map-canvas" />');
      this.$el = $('#' + this.id);
      if (!this.zoom) {
        this.zoom = 4;
      }
      this.loadGoogleMaps();
      return this;
    }

    Gmap.prototype.loadGoogleMaps = function() {
      var _this = this;
      $.getScript('https://www.google.com/jsapi', function() {
        return google.load('maps', '3', {
          other_params: 'sensor=false',
          callback: _this.create,
          libraries: "geometry"
        });
      });
      return this;
    };

    Gmap.prototype.create = function() {
      var styles;
      styles = [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [
            {
              visibility: "off"
            }
          ]
        }
      ];
      this.gmap = new google.maps.Map(document.getElementById(this.id), {
        zoom: this.zoom,
        center: new google.maps.LatLng(this.latitude, this.longitude),
        visualRefresh: true,
        disableDefaultUI: true,
        styles: styles
      });
      this.$el.trigger("load");
      return this;
    };

    return Gmap;

  })();

}).call(this);


},{}],3:[function(require,module,exports){
(function() {
  var Search,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Search = (function() {
    function Search(parent, data, fields, score) {
      this.initSearch = __bind(this.initSearch, this);
      var item, _i, _len;
      this.$el = $('<div class="map-search" />');
      $(parent).append(this.$el);
      this.$input = $('<input type="text" />');
      this.$el.append(this.$input);
      this.refs = this.results = new Array();
      if (!score) {
        this.score = 0;
      }
      this.index = lunr(function() {
        var field, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = fields.length; _i < _len; _i++) {
          field = fields[_i];
          this.field(field[0], field[1]);
          _results.push(this.ref('index'));
        }
        return _results;
      });
      this.$input.on("keyup", this.initSearch);
      if (data != null) {
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          item = data[_i];
          this.index.add(item);
        }
      }
      this.$el.trigger('ready');
      return this;
    }

    Search.prototype.initSearch = function() {
      this.filter();
      this.$el.trigger('search.change', {
        refs: this.refs
      });
      return this;
    };

    Search.prototype.getResults = function() {
      return this.results;
    };

    Search.prototype.getRefs = function() {
      return this.refs;
    };

    Search.prototype.filter = function() {
      var result, _i, _len, _ref;
      this.results = this.index.search(this.getFilter());
      this.refs = new Array();
      _ref = this.results;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.score >= this.score) {
          this.refs.push(result.ref);
        }
      }
      return this;
    };

    Search.prototype.clear = function() {
      this.$input.val("");
      this.filter();
      return this;
    };

    Search.prototype.getFilter = function() {
      return this.$input.val();
    };

    return Search;

  })();

}).call(this);


},{}],4:[function(require,module,exports){
(function() {
  var Popin,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Popin = (function() {
    function Popin(parent) {
      this.close = __bind(this.close, this);
      this.show = __bind(this.show, this);
      this.bindList = __bind(this.bindList, this);
      this.id = 'popin-content-' + (new Date().getTime());
      this.$parent = $(parent).append('<div id="' + this.id + '" class="popin-content" />');
      this.$el = this.$parent.find('.popin-content');
      this.$closeBtn = this.$parent.find('.close');
      this.$closeBtn.on("click", this.close);
      return this;
    }

    Popin.prototype.setContent = function(content) {
      this.$el.html(content);
      return this;
    };

    Popin.prototype.bindList = function() {
      var _this = this;
      this.$parent.addClass('search-list');
      this.$parent.find('.search-item').off("click");
      return this.$parent.find('.search-item').on("click", function(e) {
        var place;
        place = _this.places[$(e.taget).closest('.search-item').attr('data-id')];
        return _this.displaySingle(place);
      });
    };

    Popin.prototype.show = function() {
      this.$parent.addClass("open");
      this.$parent.trigger("open");
      return this;
    };

    Popin.prototype.close = function() {
      this.$parent.trigger("close");
      this.$parent.removeClass("open");
      return this;
    };

    return Popin;

  })();

}).call(this);


},{}],5:[function(require,module,exports){
(function() {
  var Filters,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = Filters = (function() {
    function Filters(parent, data, field, template) {
      var _this = this;
      this.template = template;
      this.setFilter = __bind(this.setFilter, this);
      this.id = 'map-filters-' + (new Date().getTime());
      $(parent).append('<div id="' + this.id + '" class="map-filters" />');
      this.$el = $('#' + this.id);
      this.parseData(data, field);
      this.filter = new Array();
      $.get(this.template).done(function(data) {
        _this.template = _.template(data);
        _this.render();
        _this.$filterBtns = _this.$el.find('.map-filter');
        return _this.$filterBtns.on("click", _this.setFilter);
      });
      return this;
    }

    Filters.prototype.parseData = function(data, field) {
      var item, _i, _len, _ref;
      this.filters = new Array();
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        if (_ref = item[field], __indexOf.call(this.filters, _ref) < 0) {
          this.filters.push(item[field]);
        }
      }
      return this;
    };

    Filters.prototype.render = function() {
      return this.$el.html(this.template({
        filters: this.filters
      }));
    };

    Filters.prototype.setFilter = function(filter) {
      var $filter;
      if (filter instanceof jQuery.Event) {
        filter.preventDefault();
        $filter = $(filter.target).closest('.map-filter');
        filter = $filter.attr('data-filter');
      }
      if (filter === "all" || __indexOf.call(this.filter, filter) >= 0) {
        $filter.removeClass("active");
        this.filter.splice(this.filter.indexOf(filter), 1);
      } else {
        $filter.addClass("active");
        this.filter.push(filter);
      }
      this.$el.trigger('search.change', {
        filter: this.filter
      });
      return this;
    };

    return Filters;

  })();

}).call(this);


},{}],6:[function(require,module,exports){
(function() {
  var Marker,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = Marker = (function(_super) {
    __extends(Marker, _super);

    function Marker(args) {
      this.filter = __bind(this.filter, this);
      Marker.__super__.constructor.call(this, args);
      google.maps.event.addListener(this.getMap(), 'search.changed', this.filter);
    }

    Marker.prototype.getField = function(field) {
      return this[field].toString();
    };

    Marker.prototype.filter = function(results) {
      var _ref;
      if (!results[0].length || (_ref = this.getField(results[1]), __indexOf.call(results[0], _ref) >= 0)) {
        return this.setVisible(true);
      } else {
        return this.setVisible(false);
      }
    };

    return Marker;

  })(google.maps.Marker);

}).call(this);


},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSx3Q0FBQTtLQUFBLDZFQUFBOztDQUFBLENBQUEsQ0FBTyxDQUFQLEdBQU8sUUFBQTs7Q0FBUCxDQUNBLENBQVMsR0FBVCxDQUFTLFVBQUE7O0NBRFQsQ0FFQSxDQUFRLEVBQVIsRUFBUSxTQUFBOztDQUZSLENBR0EsQ0FBVSxJQUFWLFdBQVU7O0NBSFYsQ0FJQSxDQUFTLEdBQVQ7O0NBSkEsQ0FNQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsRUFBQSxDQUFBLElBQUEsVUFBRTtDQUNiLFNBQUEsRUFBQTtDQUFBLEVBRGEsQ0FBQSxFQUFELEVBQ1o7Q0FBQSw4REFBQTtDQUFBLHNFQUFBO0NBQUEsRUFDRSxDQURELEVBQUQ7Q0FDRSxDQUFLLENBQUwsRUFBQSxHQUFBO0NBQUEsQ0FDTSxFQUFOLENBREEsR0FDQTtDQUZGLE9BQUE7Q0FBQSxFQUlFLENBREQsRUFBRCxHQUFBO0NBQ0UsQ0FBUSxJQUFSLEVBQUE7Q0FBQSxDQUNNLEVBQU4sSUFBQTtDQUxGLE9BQUE7Q0FBQSxFQU9BLENBQUMsRUFBRCxFQUFPO0NBUFAsRUFRb0IsQ0FBbkIsRUFBRCxHQUFVLFlBQVU7Q0FScEIsRUFTa0IsQ0FBakIsRUFBRCxHQUFVLFVBQVE7Q0FUbEIs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LEVBNEJXLEdBQUEsR0FBWDtDQUNFLE1BQUEsR0FBQTtDQUFBLEdBQUcsQ0FBSCxDQUFBLE1BQXFCO0NBQ25CLEtBQU0sRUFBTixNQUFBO0NBQUEsRUFDVSxHQUFRLENBQWxCLENBQUEsS0FBVTtDQURWLEVBRVMsQ0FBQSxFQUFULENBQWdCLENBQWhCLEtBQVM7UUFIWDtDQUtBLENBQXVCLEVBQW5CLENBQVUsQ0FBZCxTQUFpQztDQUMvQixNQUFPLENBQVAsR0FBQTtDQUFBLENBQ3dDLEVBQXZDLEVBQU0sQ0FBUSxDQUFmO01BRkYsRUFBQTtDQUlFLE1BQU8sQ0FBUDtDQUFBLEdBQ0MsRUFBTSxFQUFQO1FBVkY7Q0FBQSxDQVk4QixDQUExQixDQUFILEVBQUQsQ0FBQSxRQUFBO0NBQThCLENBQUMsRUFBQyxFQUFGLEVBQUU7Q0FaaEMsT0FZQTtDQUVBLEdBQUEsU0FBTztDQTNDVCxJQTRCVzs7Q0E1Qlg7O0NBREY7Q0FBQTs7Ozs7QUNBRTtDQUFBLEtBQUE7S0FBQTs7OzBKQUFBOztDQUFBLENBQUEsQ0FBdUIsR0FBakIsQ0FBTjtDQUVFOztDQUFhLEVBQUEsQ0FBQSxZQUFDO0NBQ1osc0NBQUE7Q0FBQSxHQUFBLEVBQUEsa0NBQU07Q0FBTixDQUN5QyxFQUE5QixDQUFNLENBQWpCLEtBQUEsS0FBQTtDQUZGLElBQWE7O0NBQWIsRUFJVSxFQUFBLEdBQVYsQ0FBVztDQUNULEdBQVMsQ0FBQSxHQUFGLEtBQUE7Q0FMVCxJQUlVOztDQUpWLEVBT1EsR0FBUixDQUFRLEVBQUM7Q0FDUCxHQUFBLE1BQUE7QUFBSSxDQUFKLENBQXlCLENBQUEsQ0FBdEIsRUFBSCxDQUFZLENBQWEsT0FBeUI7Q0FDL0MsR0FBQSxNQUFELEtBQUE7TUFERixFQUFBO0NBR0csR0FBQSxDQUFELEtBQUEsS0FBQTtRQUpJO0NBUFIsSUFPUTs7Q0FQUjs7Q0FGb0MsR0FBVyxFQUFMO0NBQTVDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJHbWFwID0gcmVxdWlyZSgnLi9HbWFwLmNvZmZlZScpXG5TZWFyY2ggPSByZXF1aXJlKCcuL1NlYXJjaC5jb2ZmZWUnKVxuUG9waW4gPSByZXF1aXJlKCcuL1BvcGluLmNvZmZlZScpXG5GaWx0ZXJzID0gcmVxdWlyZSgnLi9GaWx0ZXJzLmNvZmZlZScpXG5NYXJrZXIgPSB1bmRlZmluZWRcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMdW5yR21hcFxuICBjb25zdHJ1Y3RvcjogKEBzZWxlY3RvcikgLT5cbiAgICBAbG9hZGVyID1cbiAgICAgIG1hcDogZmFsc2VcbiAgICAgIGZlZWQ6IGZhbHNlXG4gICAgQHRlbXBsYXRlcyA9XG4gICAgICBzaW5nbGU6IFwiXCJcbiAgICAgIGxpc3Q6IFwiXCJcblxuICAgIEAkZWwgPSAkKEBzZWxlY3RvcilcbiAgICBAdGVtcGxhdGVzLnNpbmdsZSA9IEAkZWwuYXR0cignZGF0YS10ZW1wbGF0ZVNpbmdsZScpXG4gICAgQHRlbXBsYXRlcy5saXN0ID0gQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlTGlzdCcpXG4gICAgQGZpZWxkcyA9IEBwYXJzZUZpZWxkcyhAJGVsLmF0dHIoJ2RhdGEtbHVucicpKVxuICAgIEBmaWx0ZXIgPSBAJGVsLmF0dHIoJ2RhdGEtZmlsdGVyJylcblxuICAgIEBpbml0R21hcCgpXG5cbiAgICAjIEluaXQgUG9waW5cbiAgICBAcG9waW4gPSBuZXcgUG9waW4oQHNlbGVjdG9yKVxuXG4gICAgIyBHZXQgdGhlIGZlZWRcbiAgICAkLmdldChAJGVsLmF0dHIoJ2RhdGEtZmVlZCcpKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEBmZWVkID0gZGF0YVxuICAgICAgICBAaW5pdEZlZWQoKVxuICAgICAgICBAaW5pdEZpbHRlcnMoKVxuXG4gICAgIyBHZXQgdGVtcGxhdGVzXG4gICAgJC5nZXQoQHRlbXBsYXRlcy5zaW5nbGUpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlcy5zaW5nbGUgPSBfLnRlbXBsYXRlKGRhdGEpXG5cbiAgICAkLmdldChAdGVtcGxhdGVzLmxpc3QpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlcy5saXN0ID0gXy50ZW1wbGF0ZShkYXRhKVxuXG4gIGluaXRHbWFwOiAtPlxuICAgIEBtYXAgPSBuZXcgR21hcChAc2VsZWN0b3IsIEAkZWwuYXR0cignZGF0YS1sYXRpdHVkZScpLCBAJGVsLmF0dHIoJ2RhdGEtbG9uZ2l0dWRlJyksIHBhcnNlSW50KEAkZWwuYXR0cignZGF0YS16b29tJykpKVxuICAgIEBtYXAuJGVsLm9uIFwibG9hZFwiLCA9PlxuICAgICAgQGxvYWRlci5tYXAgPSB0cnVlXG4gICAgICBNYXJrZXIgPSByZXF1aXJlKCcuL01hcmtlci5jb2ZmZWUnKVxuICAgICAgIyBJbml0IG1hcmtlciBpZiB0aGUgZmVlZCBpcyBsb2FkZWRcbiAgICAgIGlmIEBsb2FkZXIuZmVlZFxuICAgICAgICBAYWRkTWFya2VycyhAZmVlZClcblxuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgQG1hcC5nbWFwLCAnc2VhcmNoLmNoYW5nZWQnLCAocmVzdWx0KSA9PlxuICAgICAgICBpZiByZXN1bHRbMV0gPT0gXCJpbmRleFwiXG4gICAgICAgICAgQGRpc3BsYXlNYXJrZXJzRnJvbVJlZnMocmVzdWx0WzBdKVxuICAgIHJldHVybiBAXG5cbiAgaW5pdEZlZWQ6ICgpLT5cbiAgICBAbG9hZGVyLmZlZWQgPSB0cnVlXG5cbiAgICAjIEluaXQgbWFya2VyIGlmIHRoZSBtYXAgaXMgbG9hZGVkXG4gICAgaWYgQGxvYWRlci5tYXBcbiAgICAgIEBhZGRNYXJrZXJzKEBmZWVkKVxuXG4gICAgIyBJbml0IHNlYXJjaFxuICAgIEBzZWFyY2ggPSBuZXcgU2VhcmNoKEBzZWxlY3RvciwgQGZlZWQsIEBmaWVsZHMpXG4gICAgQHNlYXJjaC4kZWwub24gXCJzZWFyY2guY2hhbmdlXCIsIChlLCBkYXRhKSA9PlxuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlciBAbWFwLmdtYXAsIFwic2VhcmNoLmNoYW5nZWRcIiwgW2RhdGEucmVmcywgXCJpbmRleFwiXVxuXG4gICAgcmV0dXJuIEBcblxuICAjIEluaXQgRmlsdGVyc1xuICBpbml0RmlsdGVyczogKCktPlxuICAgIEBmaWx0ZXJzID0gbmV3IEZpbHRlcnMoQHNlbGVjdG9yLCBAZmVlZCwgQGZpbHRlciwgQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlRmlsdGVycycpKVxuICAgIEBmaWx0ZXJzLiRlbC5vbiBcInNlYXJjaC5jaGFuZ2VcIiwgKGUsIGRhdGEpID0+XG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyIEBtYXAuZ21hcCwgXCJzZWFyY2guY2hhbmdlZFwiLCBbZGF0YS5maWx0ZXIsIEBmaWx0ZXJdXG5cbiAgYWRkTWFya2VyczogKGRhdGEpIC0+XG4gICAgQG1hcmtlcnMgPSBuZXcgQXJyYXlcbiAgICBmb3IgbWFya2VyIGluIGRhdGFcbiAgICAgIEBhZGRNYXJrZXIobWFya2VyKVxuICAgIHJldHVybiBAXG5cbiAgYWRkTWFya2VyOiAoZGF0YSktPlxuICAgIGRhdGEucG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGRhdGEubGF0aXR1ZGUsZGF0YS5sb25naXR1ZGUpXG4gICAgZGF0YS5tYXAgPSBAbWFwLmdtYXBcbiAgICBtYXJrZXIgPSBuZXcgTWFya2VyKGRhdGEpXG5cbiAgICBAbWFya2Vycy5wdXNoKG1hcmtlcilcblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIG1hcmtlciwgJ2NsaWNrJywgKCkgPT5cbiAgICAgIEBkaXNwbGF5U2luZ2xlKG1hcmtlcilcbiAgICByZXR1cm4gQFxuXG4gIGRpc3BsYXlTaW5nbGU6IChtYXJrZXIpIC0+XG4gICAgQHBvcGluLnNldENvbnRlbnQoQHRlbXBsYXRlcy5zaW5nbGUobWFya2VyKSlcbiAgICByZXR1cm4gQFxuXG4gIGRpc3BsYXlMaXN0OiAobWFya2VycykgLT5cbiAgICBAcG9waW4uc2V0Q29udGVudChAdGVtcGxhdGVzLmxpc3QobWFya2VyczogbWFya2VycykpXG4gICAgcmV0dXJuIEBcblxuICBkaXNwbGF5TWFya2Vyc0Zyb21SZWZzOiAocmVzdWx0KSA9PlxuICAgIEBkaXNwbGF5TGlzdChAZ2V0TWFya2Vyc0Zyb21SZWZzKHJlc3VsdCkpXG4gICAgcmV0dXJuIEBcblxuICBwYXJzZUZpZWxkczogKGRhdGEpIC0+XG4gICAgZmllbGRzID0gbmV3IEFycmF5KClcbiAgICBmb3IgZmllbGQgaW4gZGF0YS5zcGxpdCgnLCcpXG4gICAgICBmaWVsZCA9IGZpZWxkLnNwbGl0KCd8JylcbiAgICAgIGZpZWxkcy5wdXNoKFtmaWVsZFswXSwgcGFyc2VJbnQoZmllbGRbMV0pXSlcbiAgICByZXR1cm4gZmllbGRzXG5cbiAgZ2V0TWFya2Vyc0Zyb21SZWZzOiAocmVzdWx0KSA9PlxuICAgIG1hcmtlcnMgPSBuZXcgQXJyYXkoKVxuICAgIGlmIHJlc3VsdC5sZW5ndGhcbiAgICAgIGZvciBpbmRleCBpbiByZXN1bHRcbiAgICAgICAgbWFya2Vycy5wdXNoIEBtYXJrZXJzW2luZGV4XVxuICAgIHJldHVybiBtYXJrZXJzXG5cbiMgRXhwb3J0IHRoZSBjbGFzcyB0byB0aGUgZ2xvYmFsIHNjb3BlXG53aW5kb3cuTHVuckdtYXAgPSBMdW5yR21hcFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBHbWFwXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBAbGF0aXR1ZGUsIEBsb25naXR1ZGUsIEB6b29tKSAtPlxuICAgIEBpZCA9ICdtYXAtY2FudmFzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtY2FudmFzXCIgLz4nKVxuICAgIEAkZWwgPSAkKCcjJytAaWQpXG5cbiAgICBAem9vbSA9IDQgdW5sZXNzIEB6b29tXG4gICAgQGxvYWRHb29nbGVNYXBzKClcblxuICAgIHJldHVybiBAXG5cbiAgbG9hZEdvb2dsZU1hcHM6ICgpIC0+XG4gICAgJC5nZXRTY3JpcHQgJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGknLCA9PlxuICAgICAgZ29vZ2xlLmxvYWQgJ21hcHMnLCAnMycsXG4gICAgICAgIG90aGVyX3BhcmFtczogJ3NlbnNvcj1mYWxzZSdcbiAgICAgICAgY2FsbGJhY2s6IEBjcmVhdGVcbiAgICAgICAgbGlicmFyaWVzOiBcImdlb21ldHJ5XCJcbiAgICByZXR1cm4gQFxuXG4gIGNyZWF0ZTogKCkgPT5cbiAgICAjIE9wdGlvbnNcbiAgICBzdHlsZXMgPSBbXG4gICAgICBmZWF0dXJlVHlwZTogXCJwb2lcIlxuICAgICAgZWxlbWVudFR5cGU6IFwibGFiZWxzXCJcbiAgICAgIHN0eWxlcnM6IFtcbiAgICAgICAgdmlzaWJpbGl0eTogXCJvZmZcIlxuICAgICAgXVxuICAgIF1cblxuICAgICMgSW5pdGlhbGl6ZSB0aGUgZ29vZ2xlIG1hcFxuICAgIEBnbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChAaWQpLFxuICAgICAgem9vbTogQHpvb20sXG4gICAgICBjZW50ZXI6IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoQGxhdGl0dWRlLEBsb25naXR1ZGUpXG4gICAgICB2aXN1YWxSZWZyZXNoOiB0cnVlXG4gICAgICBkaXNhYmxlRGVmYXVsdFVJOiB0cnVlXG4gICAgICBzdHlsZXM6IHN0eWxlc1xuICAgIEAkZWwudHJpZ2dlcihcImxvYWRcIilcbiAgICByZXR1cm4gQFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZWFyY2hcblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGRzLCBzY29yZSkgLT5cbiAgICBAJGVsID0gJCgnPGRpdiBjbGFzcz1cIm1hcC1zZWFyY2hcIiAvPicpXG4gICAgJChwYXJlbnQpLmFwcGVuZChAJGVsKVxuICAgIEAkaW5wdXQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiAvPicpXG4gICAgQCRlbC5hcHBlbmQoQCRpbnB1dClcblxuICAgIEByZWZzID0gQHJlc3VsdHMgPSBuZXcgQXJyYXkoKVxuICAgIEBzY29yZSA9IDAgdW5sZXNzIHNjb3JlXG4gICAgQGluZGV4ID0gbHVuciAtPlxuICAgICAgZm9yIGZpZWxkIGluIGZpZWxkc1xuICAgICAgICB0aGlzLmZpZWxkKGZpZWxkWzBdLCBmaWVsZFsxXSlcbiAgICAgICAgdGhpcy5yZWYoJ2luZGV4JylcblxuICAgIEAkaW5wdXQub24gXCJrZXl1cFwiLCBAaW5pdFNlYXJjaFxuXG4gICAgaWYgZGF0YT9cbiAgICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgICAgQGluZGV4LmFkZChpdGVtKVxuXG4gICAgQCRlbC50cmlnZ2VyKCdyZWFkeScpXG4gICAgcmV0dXJuIEBcblxuICBpbml0U2VhcmNoOiAoKSA9PlxuICAgIEBmaWx0ZXIoKVxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAcmVmc30pXG4gICAgcmV0dXJuIEBcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJldHVybiBAcmVzdWx0c1xuXG4gIGdldFJlZnM6ICgpIC0+XG4gICAgcmV0dXJuIEByZWZzXG5cbiAgZmlsdGVyOiAtPlxuICAgIEByZXN1bHRzID0gQGluZGV4LnNlYXJjaChAZ2V0RmlsdGVyKCkpXG4gICAgQHJlZnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciByZXN1bHQgaW4gQHJlc3VsdHNcbiAgICAgIGlmIHJlc3VsdC5zY29yZSA+PSBAc2NvcmVcbiAgICAgICAgQHJlZnMucHVzaChyZXN1bHQucmVmKVxuICAgIHJldHVybiBAXG5cbiAgY2xlYXI6IC0+XG4gICAgQCRpbnB1dC52YWwoXCJcIilcbiAgICBAZmlsdGVyKClcbiAgICByZXR1cm4gQFxuXG4gIGdldEZpbHRlcjogLT5cbiAgICByZXR1cm4gQCRpbnB1dC52YWwoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQb3BpblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCkgLT5cbiAgICBAaWQgPSAncG9waW4tY29udGVudC0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICBAJHBhcmVudCA9ICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJwb3Bpbi1jb250ZW50XCIgLz4nKVxuICAgIEAkZWwgPSBAJHBhcmVudC5maW5kKCcucG9waW4tY29udGVudCcpXG4gICAgQCRjbG9zZUJ0biA9IEAkcGFyZW50LmZpbmQoJy5jbG9zZScpXG4gICAgQCRjbG9zZUJ0bi5vbiBcImNsaWNrXCIsIEBjbG9zZVxuXG4gICAgcmV0dXJuIEBcblxuICBzZXRDb250ZW50OiAoY29udGVudCkgLT5cbiAgICBAJGVsLmh0bWwoY29udGVudClcblxuICAgIHJldHVybiBAXG5cbiAgYmluZExpc3Q6ICgpID0+XG4gICAgQCRwYXJlbnQuYWRkQ2xhc3MoJ3NlYXJjaC1saXN0JylcbiAgICBAJHBhcmVudC5maW5kKCcuc2VhcmNoLWl0ZW0nKS5vZmYgXCJjbGlja1wiXG5cbiAgICBAJHBhcmVudC5maW5kKCcuc2VhcmNoLWl0ZW0nKS5vbiBcImNsaWNrXCIsIChlKSA9PlxuICAgICAgcGxhY2UgPSBALnBsYWNlc1skKGUudGFnZXQpLmNsb3Nlc3QoJy5zZWFyY2gtaXRlbScpLmF0dHIoJ2RhdGEtaWQnKV1cbiAgICAgIEAuZGlzcGxheVNpbmdsZShwbGFjZSlcblxuICBzaG93OiAoKSA9PlxuICAgIEAkcGFyZW50LmFkZENsYXNzKFwib3BlblwiKVxuICAgIEAkcGFyZW50LnRyaWdnZXIoXCJvcGVuXCIpXG4gICAgcmV0dXJuIEBcblxuICBjbG9zZTogKCkgPT5cbiAgICBAJHBhcmVudC50cmlnZ2VyKFwiY2xvc2VcIilcbiAgICBAJHBhcmVudC5yZW1vdmVDbGFzcyhcIm9wZW5cIilcblxuICAgIHJldHVybiBAXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZpbHRlcnNcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIGRhdGEsIGZpZWxkLCBAdGVtcGxhdGUpIC0+XG4gICAgQGlkID0gJ21hcC1maWx0ZXJzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtZmlsdGVyc1wiIC8+JylcbiAgICBAJGVsID0gJCgnIycrQGlkKVxuICAgIEBwYXJzZURhdGEgZGF0YSwgZmllbGRcbiAgICBAZmlsdGVyID0gbmV3IEFycmF5KClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGUgPSBfLnRlbXBsYXRlKGRhdGEpXG4gICAgICAgIEByZW5kZXIoKVxuICAgICAgICBAJGZpbHRlckJ0bnMgPSBAJGVsLmZpbmQoJy5tYXAtZmlsdGVyJylcbiAgICAgICAgQCRmaWx0ZXJCdG5zLm9uIFwiY2xpY2tcIiwgQHNldEZpbHRlclxuXG4gICAgcmV0dXJuIEBcblxuICAjIEdldCBhbGwgdW5pcXVlIGZpZWxkIHZhbHVlc1xuICBwYXJzZURhdGE6IChkYXRhLCBmaWVsZCkgLT5cbiAgICBAZmlsdGVycyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIGl0ZW0gaW4gZGF0YVxuICAgICAgdW5sZXNzIGl0ZW1bZmllbGRdIGluIEBmaWx0ZXJzXG4gICAgICAgIEBmaWx0ZXJzLnB1c2ggaXRlbVtmaWVsZF1cbiAgICByZXR1cm4gQFxuXG4gIHJlbmRlcjogIC0+XG4gICAgQCRlbC5odG1sKEB0ZW1wbGF0ZSh7QGZpbHRlcnN9KSlcblxuICBzZXRGaWx0ZXI6IChmaWx0ZXIpID0+XG4gICAgaWYgZmlsdGVyIGluc3RhbmNlb2YgalF1ZXJ5LkV2ZW50XG4gICAgICBmaWx0ZXIucHJldmVudERlZmF1bHQoKVxuICAgICAgJGZpbHRlciA9ICQoZmlsdGVyLnRhcmdldCkuY2xvc2VzdCgnLm1hcC1maWx0ZXInKVxuICAgICAgZmlsdGVyID0gJGZpbHRlci5hdHRyKCdkYXRhLWZpbHRlcicpXG5cbiAgICBpZiAoZmlsdGVyID09IFwiYWxsXCIgfHwgZmlsdGVyIGluIEBmaWx0ZXIpXG4gICAgICAkZmlsdGVyLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpXG4gICAgICBAZmlsdGVyLnNwbGljZShAZmlsdGVyLmluZGV4T2YoZmlsdGVyKSwgMSlcbiAgICBlbHNlXG4gICAgICAkZmlsdGVyLmFkZENsYXNzKFwiYWN0aXZlXCIpXG4gICAgICBAZmlsdGVyLnB1c2goZmlsdGVyKVxuXG4gICAgQCRlbC50cmlnZ2VyKCdzZWFyY2guY2hhbmdlJywge0BmaWx0ZXJ9KVxuXG4gICAgcmV0dXJuIEBcbiIsIiAgbW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBNYXJrZXIgZXh0ZW5kcyBnb29nbGUubWFwcy5NYXJrZXJcbiAgICAjIGV4dGVuZCB0aGUgZ29vZ2xlLm1hcHMuTWFya2VyIG9iamVjdCB0byBtYW5hZ2UgZmlsdGVyc1xuICAgIGNvbnN0cnVjdG9yOiAoYXJncykgLT5cbiAgICAgIHN1cGVyIGFyZ3NcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIEBnZXRNYXAoKSwgJ3NlYXJjaC5jaGFuZ2VkJywgQGZpbHRlclxuXG4gICAgZ2V0RmllbGQ6IChmaWVsZCkgLT5cbiAgICAgIHJldHVybiBAW2ZpZWxkXS50b1N0cmluZygpXG5cbiAgICBmaWx0ZXI6IChyZXN1bHRzKSA9PlxuICAgICAgaWYgIXJlc3VsdHNbMF0ubGVuZ3RoIHx8IEBnZXRGaWVsZChyZXN1bHRzWzFdKSBpbiByZXN1bHRzWzBdXG4gICAgICAgIEBzZXRWaXNpYmxlKHRydWUpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRWaXNpYmxlKGZhbHNlKVxuIl19
;