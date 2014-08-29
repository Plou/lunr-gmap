;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var Filters, Gmap, LunrGmap, Marker, Popin, Search;

  Gmap = require('./Gmap.coffee');

  Search = require('./Search.coffee');

  Popin = require('./Popin.coffee');

  Filters = require('./Filters.coffee');

  Marker = void 0;

  module.exports = LunrGmap = (function() {
    function LunrGmap(selector) {
      var _this = this;
      this.selector = selector;
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
          return _this.addMarkers(_this.feed);
        }
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

    return LunrGmap;

  })();

  window.LunrGmap = LunrGmap;

}).call(this);


},{"./Gmap.coffee":2,"./Popin.coffee":3,"./Search.coffee":4,"./Filters.coffee":5,"./Marker.coffee":6}],2:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1BvcGluLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSx3Q0FBQTs7Q0FBQSxDQUFBLENBQU8sQ0FBUCxHQUFPLFFBQUE7O0NBQVAsQ0FDQSxDQUFTLEdBQVQsQ0FBUyxVQUFBOztDQURULENBRUEsQ0FBUSxFQUFSLEVBQVEsU0FBQTs7Q0FGUixDQUdBLENBQVUsSUFBVixXQUFVOztDQUhWLENBSUEsQ0FBUyxHQUFUOztDQUpBLENBTUEsQ0FBdUIsR0FBakIsQ0FBTjtDQUNlLEVBQUEsQ0FBQSxJQUFBLFVBQUU7Q0FDYixTQUFBLEVBQUE7Q0FBQSxFQURhLENBQUEsRUFBRCxFQUNaO0NBQUEsRUFDRSxDQURELEVBQUQ7Q0FDRSxDQUFLLENBQUwsRUFBQSxHQUFBO0NBQUEsQ0FDTSxFQUFOLENBREEsR0FDQTtDQUZGLE9BQUE7Q0FBQSxFQUlFLENBREQsRUFBRCxHQUFBO0NBQ0UsQ0FBUSxJQUFSLEVBQUE7Q0FBQSxDQUNNLEVBQU4sSUFBQTtDQUxGLE9BQUE7Q0FBQSxFQU9BLENBQUMsRUFBRCxFQUFPO0NBUFAsRUFRb0IsQ0FBbkIsRUFBRCxHQUFVLFlBQVU7Q0FScEIsRUFTa0IsQ0FBakIsRUFBRCxHQUFVLFVBQVE7Q0FUbEIsRUFVVSxDQUFULEVBQUQsS0FBVTtDQVZWLEVBV1UsQ0FB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QUFqQixLQUFBLEtBQUE7Q0FGRixJQUFhOztDQUFiLEVBSVUsRUFBQSxHQUFWLENBQVc7Q0FDVCxHQUFTLENBQUEsR0FBRixLQUFBO0NBTFQsSUFJVTs7Q0FKVixFQU9RLEdBQVIsQ0FBUSxFQUFDO0NBQ1AsR0FBQSxNQUFBO0FBQUksQ0FBSixDQUF5QixDQUFBLENBQXRCLEVBQUgsQ0FBWSxDQUFhLE9BQXlCO0NBQy9DLEdBQUEsTUFBRCxLQUFBO01BREYsRUFBQTtDQUdHLEdBQUEsQ0FBRCxLQUFBLEtBQUE7UUFKSTtDQVBSLElBT1E7O0NBUFI7O0NBRm9DLEdBQVcsRUFBTDtDQUE1QyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiR21hcCA9IHJlcXVpcmUoJy4vR21hcC5jb2ZmZWUnKVxuU2VhcmNoID0gcmVxdWlyZSgnLi9TZWFyY2guY29mZmVlJylcblBvcGluID0gcmVxdWlyZSgnLi9Qb3Bpbi5jb2ZmZWUnKVxuRmlsdGVycyA9IHJlcXVpcmUoJy4vRmlsdGVycy5jb2ZmZWUnKVxuTWFya2VyID0gdW5kZWZpbmVkXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTHVuckdtYXBcbiAgY29uc3RydWN0b3I6IChAc2VsZWN0b3IpIC0+XG4gICAgQGxvYWRlciA9XG4gICAgICBtYXA6IGZhbHNlXG4gICAgICBmZWVkOiBmYWxzZVxuICAgIEB0ZW1wbGF0ZXMgPVxuICAgICAgc2luZ2xlOiBcIlwiXG4gICAgICBsaXN0OiBcIlwiXG5cbiAgICBAJGVsID0gJChAc2VsZWN0b3IpXG4gICAgQHRlbXBsYXRlcy5zaW5nbGUgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVTaW5nbGUnKVxuICAgIEB0ZW1wbGF0ZXMubGlzdCA9IEAkZWwuYXR0cignZGF0YS10ZW1wbGF0ZUxpc3QnKVxuICAgIEBmaWVsZHMgPSBAcGFyc2VGaWVsZHMoQCRlbC5hdHRyKCdkYXRhLWx1bnInKSlcbiAgICBAZmlsdGVyID0gQCRlbC5hdHRyKCdkYXRhLWZpbHRlcicpXG5cbiAgICBAaW5pdEdtYXAoKVxuXG4gICAgIyBJbml0IFBvcGluXG4gICAgQHBvcGluID0gbmV3IFBvcGluKEBzZWxlY3RvcilcblxuICAgICMgR2V0IHRoZSBmZWVkXG4gICAgJC5nZXQoQCRlbC5hdHRyKCdkYXRhLWZlZWQnKSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAZmVlZCA9IGRhdGFcbiAgICAgICAgQGluaXRGZWVkKClcbiAgICAgICAgQGluaXRGaWx0ZXJzKClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZXMuc2luZ2xlKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gXy50ZW1wbGF0ZShkYXRhKVxuXG4gICAgJC5nZXQoQHRlbXBsYXRlcy5saXN0KVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZXMubGlzdCA9IF8udGVtcGxhdGUoZGF0YSlcblxuICBpbml0R21hcDogLT5cbiAgICBAbWFwID0gbmV3IEdtYXAoQHNlbGVjdG9yLCBAJGVsLmF0dHIoJ2RhdGEtbGF0aXR1ZGUnKSwgQCRlbC5hdHRyKCdkYXRhLWxvbmdpdHVkZScpLCBwYXJzZUludChAJGVsLmF0dHIoJ2RhdGEtem9vbScpKSlcbiAgICBAbWFwLiRlbC5vbiBcImxvYWRcIiwgPT5cbiAgICAgIEBsb2FkZXIubWFwID0gdHJ1ZVxuICAgICAgTWFya2VyID0gcmVxdWlyZSgnLi9NYXJrZXIuY29mZmVlJylcblxuICAgICAgIyBJbml0IG1hcmtlciBpZiB0aGUgZmVlZCBpcyBsb2FkZWRcbiAgICAgIGlmIEBsb2FkZXIuZmVlZFxuICAgICAgICBAYWRkTWFya2VycyhAZmVlZClcbiAgICByZXR1cm4gQFxuXG4gIGluaXRGZWVkOiAoKS0+XG4gICAgQGxvYWRlci5mZWVkID0gdHJ1ZVxuXG4gICAgIyBJbml0IG1hcmtlciBpZiB0aGUgbWFwIGlzIGxvYWRlZFxuICAgIGlmIEBsb2FkZXIubWFwXG4gICAgICBAYWRkTWFya2VycyhAZmVlZClcblxuICAgICMgSW5pdCBzZWFyY2hcbiAgICBAc2VhcmNoID0gbmV3IFNlYXJjaChAc2VsZWN0b3IsIEBmZWVkLCBAZmllbGRzKVxuICAgIEBzZWFyY2guJGVsLm9uIFwic2VhcmNoLmNoYW5nZVwiLCAoZSwgZGF0YSkgPT5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VkXCIsIFtkYXRhLnJlZnMsIFwiaW5kZXhcIl1cbiAgICByZXR1cm4gQFxuXG4gICMgSW5pdCBGaWx0ZXJzXG4gIGluaXRGaWx0ZXJzOiAoKS0+XG4gICAgQGZpbHRlcnMgPSBuZXcgRmlsdGVycyhAc2VsZWN0b3IsIEBmZWVkLCBAZmlsdGVyLCBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVGaWx0ZXJzJykpXG4gICAgQGZpbHRlcnMuJGVsLm9uIFwic2VhcmNoLmNoYW5nZVwiLCAoZSwgZGF0YSkgPT5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VkXCIsIFtkYXRhLmZpbHRlciwgQGZpbHRlcl1cblxuICBhZGRNYXJrZXJzOiAoZGF0YSkgLT5cbiAgICBAbWFya2VycyA9IG5ldyBBcnJheVxuICAgIGZvciBtYXJrZXIgaW4gZGF0YVxuICAgICAgQGFkZE1hcmtlcihtYXJrZXIpXG4gICAgcmV0dXJuIEBcblxuICBhZGRNYXJrZXI6IChkYXRhKS0+XG4gICAgZGF0YS5wb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoZGF0YS5sYXRpdHVkZSxkYXRhLmxvbmdpdHVkZSlcbiAgICBkYXRhLm1hcCA9IEBtYXAuZ21hcFxuICAgIG1hcmtlciA9IG5ldyBNYXJrZXIoZGF0YSlcblxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgbWFya2VyLCAnY2xpY2snLCAoKSA9PlxuICAgICAgQGRpc3BsYXlTaW5nbGUobWFya2VyKVxuICAgIHJldHVybiBAXG5cbiAgZGlzcGxheVNpbmdsZTogKG1hcmtlcikgLT5cbiAgICBAcG9waW4uc2V0Q29udGVudChAdGVtcGxhdGVzLnNpbmdsZShtYXJrZXIpKVxuICAgIHJldHVybiBAXG5cbiAgcGFyc2VGaWVsZHM6IChkYXRhKSAtPlxuICAgIGZpZWxkcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIGZpZWxkIGluIGRhdGEuc3BsaXQoJywnKVxuICAgICAgZmllbGQgPSBmaWVsZC5zcGxpdCgnfCcpXG4gICAgICBmaWVsZHMucHVzaChbZmllbGRbMF0sIHBhcnNlSW50KGZpZWxkWzFdKV0pXG4gICAgcmV0dXJuIGZpZWxkc1xuXG4jIEV4cG9ydCB0aGUgY2xhc3MgdG8gdGhlIGdsb2JhbCBzY29wZVxud2luZG93Lkx1bnJHbWFwID0gTHVuckdtYXBcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgR21hcFxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgQGxhdGl0dWRlLCBAbG9uZ2l0dWRlLCBAem9vbSkgLT5cbiAgICBAaWQgPSAnbWFwLWNhbnZhcy0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwibWFwLWNhbnZhc1wiIC8+JylcbiAgICBAJGVsID0gJCgnIycrQGlkKVxuXG4gICAgQHpvb20gPSA0IHVubGVzcyBAem9vbVxuICAgIEBsb2FkR29vZ2xlTWFwcygpXG5cbiAgICByZXR1cm4gQFxuXG4gIGxvYWRHb29nbGVNYXBzOiAoKSAtPlxuICAgICQuZ2V0U2NyaXB0ICdodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpJywgPT5cbiAgICAgIGdvb2dsZS5sb2FkICdtYXBzJywgJzMnLFxuICAgICAgICBvdGhlcl9wYXJhbXM6ICdzZW5zb3I9ZmFsc2UnXG4gICAgICAgIGNhbGxiYWNrOiBAY3JlYXRlXG4gICAgICAgIGxpYnJhcmllczogXCJnZW9tZXRyeVwiXG4gICAgcmV0dXJuIEBcblxuICBjcmVhdGU6ICgpID0+XG4gICAgIyBPcHRpb25zXG4gICAgc3R5bGVzID0gW1xuICAgICAgZmVhdHVyZVR5cGU6IFwicG9pXCJcbiAgICAgIGVsZW1lbnRUeXBlOiBcImxhYmVsc1wiXG4gICAgICBzdHlsZXJzOiBbXG4gICAgICAgIHZpc2liaWxpdHk6IFwib2ZmXCJcbiAgICAgIF1cbiAgICBdXG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGdvb2dsZSBtYXBcbiAgICBAZ21hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoQGlkKSxcbiAgICAgIHpvb206IEB6b29tLFxuICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKEBsYXRpdHVkZSxAbG9uZ2l0dWRlKVxuICAgICAgdmlzdWFsUmVmcmVzaDogdHJ1ZVxuICAgICAgZGlzYWJsZURlZmF1bHRVSTogdHJ1ZVxuICAgICAgc3R5bGVzOiBzdHlsZXNcbiAgICBAJGVsLnRyaWdnZXIoXCJsb2FkXCIpXG4gICAgcmV0dXJuIEBcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUG9waW5cbiAgY29uc3RydWN0b3I6IChwYXJlbnQpIC0+XG4gICAgQGlkID0gJ3BvcGluLWNvbnRlbnQtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgQCRwYXJlbnQgPSAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwicG9waW4tY29udGVudFwiIC8+JylcbiAgICBAJGVsID0gQCRwYXJlbnQuZmluZCgnLnBvcGluLWNvbnRlbnQnKVxuICAgIEAkY2xvc2VCdG4gPSBAJHBhcmVudC5maW5kKCcuY2xvc2UnKVxuICAgIEAkY2xvc2VCdG4ub24gXCJjbGlja1wiLCBAY2xvc2VcblxuICAgIHJldHVybiBAXG5cbiAgc2V0Q29udGVudDogKGNvbnRlbnQpIC0+XG4gICAgQCRlbC5odG1sKGNvbnRlbnQpXG5cbiAgICByZXR1cm4gQFxuXG4gIGJpbmRMaXN0OiAoKSA9PlxuICAgIEAkcGFyZW50LmFkZENsYXNzKCdzZWFyY2gtbGlzdCcpXG4gICAgQCRwYXJlbnQuZmluZCgnLnNlYXJjaC1pdGVtJykub2ZmIFwiY2xpY2tcIlxuXG4gICAgQCRwYXJlbnQuZmluZCgnLnNlYXJjaC1pdGVtJykub24gXCJjbGlja1wiLCAoZSkgPT5cbiAgICAgIHBsYWNlID0gQC5wbGFjZXNbJChlLnRhZ2V0KS5jbG9zZXN0KCcuc2VhcmNoLWl0ZW0nKS5hdHRyKCdkYXRhLWlkJyldXG4gICAgICBALmRpc3BsYXlTaW5nbGUocGxhY2UpXG5cbiAgc2hvdzogKCkgPT5cbiAgICBAJHBhcmVudC5hZGRDbGFzcyhcIm9wZW5cIilcbiAgICBAJHBhcmVudC50cmlnZ2VyKFwib3BlblwiKVxuICAgIHJldHVybiBAXG5cbiAgY2xvc2U6ICgpID0+XG4gICAgQCRwYXJlbnQudHJpZ2dlcihcImNsb3NlXCIpXG4gICAgQCRwYXJlbnQucmVtb3ZlQ2xhc3MoXCJvcGVuXCIpXG5cbiAgICByZXR1cm4gQFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZWFyY2hcblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGRzLCBzY29yZSkgLT5cbiAgICBAJGVsID0gJCgnPGRpdiBjbGFzcz1cIm1hcC1zZWFyY2hcIiAvPicpXG4gICAgJChwYXJlbnQpLmFwcGVuZChAJGVsKVxuICAgIEAkaW5wdXQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiAvPicpXG4gICAgQCRlbC5hcHBlbmQoQCRpbnB1dClcblxuICAgIEByZWZzID0gQHJlc3VsdHMgPSBuZXcgQXJyYXkoKVxuICAgIEBzY29yZSA9IDAgdW5sZXNzIHNjb3JlXG4gICAgQGluZGV4ID0gbHVuciAtPlxuICAgICAgZm9yIGZpZWxkIGluIGZpZWxkc1xuICAgICAgICB0aGlzLmZpZWxkKGZpZWxkWzBdLCBmaWVsZFsxXSlcbiAgICAgICAgdGhpcy5yZWYoJ2luZGV4JylcblxuICAgIEAkaW5wdXQub24gXCJrZXl1cFwiLCBAaW5pdFNlYXJjaFxuXG4gICAgaWYgZGF0YT9cbiAgICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgICAgQGluZGV4LmFkZChpdGVtKVxuXG4gICAgQCRlbC50cmlnZ2VyKCdyZWFkeScpXG4gICAgcmV0dXJuIEBcblxuICBpbml0U2VhcmNoOiAoKSA9PlxuICAgIEBmaWx0ZXIoKVxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAcmVmc30pXG4gICAgcmV0dXJuIEBcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJldHVybiBAcmVzdWx0c1xuXG4gIGdldFJlZnM6ICgpIC0+XG4gICAgcmV0dXJuIEByZWZzXG5cbiAgZmlsdGVyOiAtPlxuICAgIEByZXN1bHRzID0gQGluZGV4LnNlYXJjaChAZ2V0RmlsdGVyKCkpXG4gICAgQHJlZnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciByZXN1bHQgaW4gQHJlc3VsdHNcbiAgICAgIGlmIHJlc3VsdC5zY29yZSA+PSBAc2NvcmVcbiAgICAgICAgQHJlZnMucHVzaChyZXN1bHQucmVmKVxuICAgIHJldHVybiBAXG5cbiAgY2xlYXI6IC0+XG4gICAgQCRpbnB1dC52YWwoXCJcIilcbiAgICBAZmlsdGVyKClcbiAgICByZXR1cm4gQFxuXG4gIGdldEZpbHRlcjogLT5cbiAgICByZXR1cm4gQCRpbnB1dC52YWwoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGaWx0ZXJzXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBkYXRhLCBmaWVsZCwgQHRlbXBsYXRlKSAtPlxuICAgIEBpZCA9ICdtYXAtZmlsdGVycy0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwibWFwLWZpbHRlcnNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcbiAgICBAcGFyc2VEYXRhIGRhdGEsIGZpZWxkXG4gICAgQGZpbHRlciA9IG5ldyBBcnJheSgpXG5cbiAgICAjIEdldCB0ZW1wbGF0ZXNcbiAgICAkLmdldChAdGVtcGxhdGUpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlID0gXy50ZW1wbGF0ZShkYXRhKVxuICAgICAgICBAcmVuZGVyKClcbiAgICAgICAgQCRmaWx0ZXJCdG5zID0gQCRlbC5maW5kKCcubWFwLWZpbHRlcicpXG4gICAgICAgIEAkZmlsdGVyQnRucy5vbiBcImNsaWNrXCIsIEBzZXRGaWx0ZXJcblxuICAgIHJldHVybiBAXG5cbiAgIyBHZXQgYWxsIHVuaXF1ZSBmaWVsZCB2YWx1ZXNcbiAgcGFyc2VEYXRhOiAoZGF0YSwgZmllbGQpIC0+XG4gICAgQGZpbHRlcnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgIHVubGVzcyBpdGVtW2ZpZWxkXSBpbiBAZmlsdGVyc1xuICAgICAgICBAZmlsdGVycy5wdXNoIGl0ZW1bZmllbGRdXG4gICAgcmV0dXJuIEBcblxuICByZW5kZXI6ICAtPlxuICAgIEAkZWwuaHRtbChAdGVtcGxhdGUoe0BmaWx0ZXJzfSkpXG5cbiAgc2V0RmlsdGVyOiAoZmlsdGVyKSA9PlxuICAgIGlmIGZpbHRlciBpbnN0YW5jZW9mIGpRdWVyeS5FdmVudFxuICAgICAgZmlsdGVyLnByZXZlbnREZWZhdWx0KClcbiAgICAgICRmaWx0ZXIgPSAkKGZpbHRlci50YXJnZXQpLmNsb3Nlc3QoJy5tYXAtZmlsdGVyJylcbiAgICAgIGZpbHRlciA9ICRmaWx0ZXIuYXR0cignZGF0YS1maWx0ZXInKVxuXG4gICAgaWYgKGZpbHRlciA9PSBcImFsbFwiIHx8IGZpbHRlciBpbiBAZmlsdGVyKVxuICAgICAgJGZpbHRlci5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAgICAgQGZpbHRlci5zcGxpY2UoQGZpbHRlci5pbmRleE9mKGZpbHRlciksIDEpXG4gICAgZWxzZVxuICAgICAgJGZpbHRlci5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuICAgICAgQGZpbHRlci5wdXNoKGZpbHRlcilcblxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAZmlsdGVyfSlcblxuICAgIHJldHVybiBAXG4iLCIgIG1vZHVsZS5leHBvcnRzID0gY2xhc3MgTWFya2VyIGV4dGVuZHMgZ29vZ2xlLm1hcHMuTWFya2VyXG4gICAgIyBleHRlbmQgdGhlIGdvb2dsZS5tYXBzLk1hcmtlciBvYmplY3QgdG8gbWFuYWdlIGZpbHRlcnNcbiAgICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgICBzdXBlciBhcmdzXG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBAZ2V0TWFwKCksICdzZWFyY2guY2hhbmdlZCcsIEBmaWx0ZXJcblxuICAgIGdldEZpZWxkOiAoZmllbGQpIC0+XG4gICAgICByZXR1cm4gQFtmaWVsZF0udG9TdHJpbmcoKVxuXG4gICAgZmlsdGVyOiAocmVzdWx0cykgPT5cbiAgICAgIGlmICFyZXN1bHRzWzBdLmxlbmd0aCB8fCBAZ2V0RmllbGQocmVzdWx0c1sxXSkgaW4gcmVzdWx0c1swXVxuICAgICAgICBAc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0VmlzaWJsZShmYWxzZSlcbiJdfQ==
;