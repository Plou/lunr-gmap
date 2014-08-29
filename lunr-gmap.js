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
      if (filter instanceof jQuery.Event) {
        filter.preventDefault();
        filter = $(filter.target).closest('.map-filter').attr('data-filter');
      }
      console.log(filter, this.filter.join());
      if (filter === "all" || filter === this.filter.join()) {
        this.$filterBtns.removeClass("active");
        this.filter = new Array();
      } else {
        this.$filterBtns.not($(filter.target).closest('.map-filter')).removeClass("active");
        $('[data-filter="' + filter + '"]').addClass("active");
        this.filter = new Array(filter);
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSx3Q0FBQTs7Q0FBQSxDQUFBLENBQU8sQ0FBUCxHQUFPLFFBQUE7O0NBQVAsQ0FDQSxDQUFTLEdBQVQsQ0FBUyxVQUFBOztDQURULENBRUEsQ0FBUSxFQUFSLEVBQVEsU0FBQTs7Q0FGUixDQUdBLENBQVUsSUFBVixXQUFVOztDQUhWLENBSUEsQ0FBUyxHQUFUOztDQUpBLENBTUEsQ0FBdUIsR0FBakIsQ0FBTjtDQUNlLEVBQUEsQ0FBQSxJQUFBLFVBQUU7Q0FDYixTQUFBLEVBQUE7Q0FBQSxFQURhLENBQUEsRUFBRCxFQUNaO0NBQUEsRUFDRSxDQURELEVBQUQ7Q0FDRSxDQUFLLENBQUwsRUFBQSxHQUFBO0NBQUEsQ0FDTSxFQUFOLENBREEsR0FDQTtDQUZGLE9BQUE7Q0FBQSxFQUlFLENBREQsRUFBRCxHQUFBO0NBQ0UsQ0FBUSxJQUFSLEVBQUE7Q0FBQSxDQUNNLEVBQU4sSUFBQTtDQUxGLE9BQUE7Q0FBQSxFQU9BLENBQUMsRUFBRCxFQUFPO0NBUFAsRUFRb0IsQ0FBbkIsRUFBRCxHQUFVLFlBQVU7Q0FScEIsRUFTa0IsQ0FBakIsRUFBRCxHQUFVLFVBQVE7Q0FUbEIsRUFVVSxDQUFULEVBQUQsS0FBVTtDQVZWLEVBV1UsQ0FB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LEdBQUEsRUFBQSxrQ0FBTTtDQUFOLENBQ3lDLEVBQTlCLENBQU0sQ0FBakIsS0FBQSxLQUFBO0NBRkYsSUFBYTs7Q0FBYixFQUlVLEVBQUEsR0FBVixDQUFXO0NBQ1QsR0FBUyxDQUFBLEdBQUYsS0FBQTtDQUxULElBSVU7O0NBSlYsRUFPUSxHQUFSLENBQVEsRUFBQztDQUNQLEdBQUEsTUFBQTtBQUFJLENBQUosQ0FBeUIsQ0FBQSxDQUF0QixFQUFILENBQVksQ0FBYSxPQUF5QjtDQUMvQyxHQUFBLE1BQUQsS0FBQTtNQURGLEVBQUE7Q0FHRyxHQUFBLENBQUQsS0FBQSxLQUFBO1FBSkk7Q0FQUixJQU9ROztDQVBSOztDQUZvQyxHQUFXLEVBQUw7Q0FBNUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIkdtYXAgPSByZXF1aXJlKCcuL0dtYXAuY29mZmVlJylcblNlYXJjaCA9IHJlcXVpcmUoJy4vU2VhcmNoLmNvZmZlZScpXG5Qb3BpbiA9IHJlcXVpcmUoJy4vUG9waW4uY29mZmVlJylcbkZpbHRlcnMgPSByZXF1aXJlKCcuL0ZpbHRlcnMuY29mZmVlJylcbk1hcmtlciA9IHVuZGVmaW5lZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEx1bnJHbWFwXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdG9yKSAtPlxuICAgIEBsb2FkZXIgPVxuICAgICAgbWFwOiBmYWxzZVxuICAgICAgZmVlZDogZmFsc2VcbiAgICBAdGVtcGxhdGVzID1cbiAgICAgIHNpbmdsZTogXCJcIlxuICAgICAgbGlzdDogXCJcIlxuXG4gICAgQCRlbCA9ICQoQHNlbGVjdG9yKVxuICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlU2luZ2xlJylcbiAgICBAdGVtcGxhdGVzLmxpc3QgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVMaXN0JylcbiAgICBAZmllbGRzID0gQHBhcnNlRmllbGRzKEAkZWwuYXR0cignZGF0YS1sdW5yJykpXG4gICAgQGZpbHRlciA9IEAkZWwuYXR0cignZGF0YS1maWx0ZXInKVxuXG4gICAgQGluaXRHbWFwKClcblxuICAgICMgSW5pdCBQb3BpblxuICAgIEBwb3BpbiA9IG5ldyBQb3BpbihAc2VsZWN0b3IpXG5cbiAgICAjIEdldCB0aGUgZmVlZFxuICAgICQuZ2V0KEAkZWwuYXR0cignZGF0YS1mZWVkJykpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQGZlZWQgPSBkYXRhXG4gICAgICAgIEBpbml0RmVlZCgpXG4gICAgICAgIEBpbml0RmlsdGVycygpXG5cbiAgICAjIEdldCB0ZW1wbGF0ZXNcbiAgICAkLmdldChAdGVtcGxhdGVzLnNpbmdsZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGVzLnNpbmdsZSA9IF8udGVtcGxhdGUoZGF0YSlcblxuICAgICQuZ2V0KEB0ZW1wbGF0ZXMubGlzdClcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGVzLmxpc3QgPSBfLnRlbXBsYXRlKGRhdGEpXG5cbiAgaW5pdEdtYXA6IC0+XG4gICAgQG1hcCA9IG5ldyBHbWFwKEBzZWxlY3RvciwgQCRlbC5hdHRyKCdkYXRhLWxhdGl0dWRlJyksIEAkZWwuYXR0cignZGF0YS1sb25naXR1ZGUnKSwgcGFyc2VJbnQoQCRlbC5hdHRyKCdkYXRhLXpvb20nKSkpXG4gICAgQG1hcC4kZWwub24gXCJsb2FkXCIsID0+XG4gICAgICBAbG9hZGVyLm1hcCA9IHRydWVcbiAgICAgIE1hcmtlciA9IHJlcXVpcmUoJy4vTWFya2VyLmNvZmZlZScpXG5cbiAgICAgICMgSW5pdCBtYXJrZXIgaWYgdGhlIGZlZWQgaXMgbG9hZGVkXG4gICAgICBpZiBAbG9hZGVyLmZlZWRcbiAgICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG4gICAgcmV0dXJuIEBcblxuICBpbml0RmVlZDogKCktPlxuICAgIEBsb2FkZXIuZmVlZCA9IHRydWVcblxuICAgICMgSW5pdCBtYXJrZXIgaWYgdGhlIG1hcCBpcyBsb2FkZWRcbiAgICBpZiBAbG9hZGVyLm1hcFxuICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG5cbiAgICAjIEluaXQgc2VhcmNoXG4gICAgQHNlYXJjaCA9IG5ldyBTZWFyY2goQHNlbGVjdG9yLCBAZmVlZCwgQGZpZWxkcylcbiAgICBAc2VhcmNoLiRlbC5vbiBcInNlYXJjaC5jaGFuZ2VcIiwgKGUsIGRhdGEpID0+XG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyIEBtYXAuZ21hcCwgXCJzZWFyY2guY2hhbmdlZFwiLCBbZGF0YS5yZWZzLCBcImluZGV4XCJdXG4gICAgcmV0dXJuIEBcblxuICAjIEluaXQgRmlsdGVyc1xuICBpbml0RmlsdGVyczogKCktPlxuICAgIEBmaWx0ZXJzID0gbmV3IEZpbHRlcnMoQHNlbGVjdG9yLCBAZmVlZCwgQGZpbHRlciwgQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlRmlsdGVycycpKVxuICAgIEBmaWx0ZXJzLiRlbC5vbiBcInNlYXJjaC5jaGFuZ2VcIiwgKGUsIGRhdGEpID0+XG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyIEBtYXAuZ21hcCwgXCJzZWFyY2guY2hhbmdlZFwiLCBbZGF0YS5maWx0ZXIsIEBmaWx0ZXJdXG5cbiAgYWRkTWFya2VyczogKGRhdGEpIC0+XG4gICAgQG1hcmtlcnMgPSBuZXcgQXJyYXlcbiAgICBmb3IgbWFya2VyIGluIGRhdGFcbiAgICAgIEBhZGRNYXJrZXIobWFya2VyKVxuICAgIHJldHVybiBAXG5cbiAgYWRkTWFya2VyOiAoZGF0YSktPlxuICAgIGRhdGEucG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGRhdGEubGF0aXR1ZGUsZGF0YS5sb25naXR1ZGUpXG4gICAgZGF0YS5tYXAgPSBAbWFwLmdtYXBcbiAgICBtYXJrZXIgPSBuZXcgTWFya2VyKGRhdGEpXG5cbiAgICBAbWFya2Vycy5wdXNoKG1hcmtlcilcblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIG1hcmtlciwgJ2NsaWNrJywgKCkgPT5cbiAgICAgIEBkaXNwbGF5U2luZ2xlKG1hcmtlcilcbiAgICByZXR1cm4gQFxuXG4gIGRpc3BsYXlTaW5nbGU6IChtYXJrZXIpIC0+XG4gICAgQHBvcGluLnNldENvbnRlbnQoQHRlbXBsYXRlcy5zaW5nbGUobWFya2VyKSlcbiAgICByZXR1cm4gQFxuXG4gIHBhcnNlRmllbGRzOiAoZGF0YSkgLT5cbiAgICBmaWVsZHMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciBmaWVsZCBpbiBkYXRhLnNwbGl0KCcsJylcbiAgICAgIGZpZWxkID0gZmllbGQuc3BsaXQoJ3wnKVxuICAgICAgZmllbGRzLnB1c2goW2ZpZWxkWzBdLCBwYXJzZUludChmaWVsZFsxXSldKVxuICAgIHJldHVybiBmaWVsZHNcblxuIyBFeHBvcnQgdGhlIGNsYXNzIHRvIHRoZSBnbG9iYWwgc2NvcGVcbndpbmRvdy5MdW5yR21hcCA9IEx1bnJHbWFwXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEdtYXBcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIEBsYXRpdHVkZSwgQGxvbmdpdHVkZSwgQHpvb20pIC0+XG4gICAgQGlkID0gJ21hcC1jYW52YXMtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cIm1hcC1jYW52YXNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcblxuICAgIEB6b29tID0gNCB1bmxlc3MgQHpvb21cbiAgICBAbG9hZEdvb2dsZU1hcHMoKVxuXG4gICAgcmV0dXJuIEBcblxuICBsb2FkR29vZ2xlTWFwczogKCkgLT5cbiAgICAkLmdldFNjcmlwdCAnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaScsID0+XG4gICAgICBnb29nbGUubG9hZCAnbWFwcycsICczJyxcbiAgICAgICAgb3RoZXJfcGFyYW1zOiAnc2Vuc29yPWZhbHNlJ1xuICAgICAgICBjYWxsYmFjazogQGNyZWF0ZVxuICAgICAgICBsaWJyYXJpZXM6IFwiZ2VvbWV0cnlcIlxuICAgIHJldHVybiBAXG5cbiAgY3JlYXRlOiAoKSA9PlxuICAgICMgT3B0aW9uc1xuICAgIHN0eWxlcyA9IFtcbiAgICAgIGZlYXR1cmVUeXBlOiBcInBvaVwiXG4gICAgICBlbGVtZW50VHlwZTogXCJsYWJlbHNcIlxuICAgICAgc3R5bGVyczogW1xuICAgICAgICB2aXNpYmlsaXR5OiBcIm9mZlwiXG4gICAgICBdXG4gICAgXVxuXG4gICAgIyBJbml0aWFsaXplIHRoZSBnb29nbGUgbWFwXG4gICAgQGdtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKEBpZCksXG4gICAgICB6b29tOiBAem9vbSxcbiAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhAbGF0aXR1ZGUsQGxvbmdpdHVkZSlcbiAgICAgIHZpc3VhbFJlZnJlc2g6IHRydWVcbiAgICAgIGRpc2FibGVEZWZhdWx0VUk6IHRydWVcbiAgICAgIHN0eWxlczogc3R5bGVzXG4gICAgQCRlbC50cmlnZ2VyKFwibG9hZFwiKVxuICAgIHJldHVybiBAXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlYXJjaFxuXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBkYXRhLCBmaWVsZHMsIHNjb3JlKSAtPlxuICAgIEAkZWwgPSAkKCc8ZGl2IGNsYXNzPVwibWFwLXNlYXJjaFwiIC8+JylcbiAgICAkKHBhcmVudCkuYXBwZW5kKEAkZWwpXG4gICAgQCRpbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIC8+JylcbiAgICBAJGVsLmFwcGVuZChAJGlucHV0KVxuXG4gICAgQHJlZnMgPSBAcmVzdWx0cyA9IG5ldyBBcnJheSgpXG4gICAgQHNjb3JlID0gMCB1bmxlc3Mgc2NvcmVcbiAgICBAaW5kZXggPSBsdW5yIC0+XG4gICAgICBmb3IgZmllbGQgaW4gZmllbGRzXG4gICAgICAgIHRoaXMuZmllbGQoZmllbGRbMF0sIGZpZWxkWzFdKVxuICAgICAgICB0aGlzLnJlZignaW5kZXgnKVxuXG4gICAgQCRpbnB1dC5vbiBcImtleXVwXCIsIEBpbml0U2VhcmNoXG5cbiAgICBpZiBkYXRhP1xuICAgICAgZm9yIGl0ZW0gaW4gZGF0YVxuICAgICAgICBAaW5kZXguYWRkKGl0ZW0pXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3JlYWR5JylcbiAgICByZXR1cm4gQFxuXG4gIGluaXRTZWFyY2g6ICgpID0+XG4gICAgQGZpbHRlcigpXG4gICAgQCRlbC50cmlnZ2VyKCdzZWFyY2guY2hhbmdlJywge0ByZWZzfSlcbiAgICByZXR1cm4gQFxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmV0dXJuIEByZXN1bHRzXG5cbiAgZ2V0UmVmczogKCkgLT5cbiAgICByZXR1cm4gQHJlZnNcblxuICBmaWx0ZXI6IC0+XG4gICAgQHJlc3VsdHMgPSBAaW5kZXguc2VhcmNoKEBnZXRGaWx0ZXIoKSlcbiAgICBAcmVmcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIHJlc3VsdCBpbiBAcmVzdWx0c1xuICAgICAgaWYgcmVzdWx0LnNjb3JlID49IEBzY29yZVxuICAgICAgICBAcmVmcy5wdXNoKHJlc3VsdC5yZWYpXG4gICAgcmV0dXJuIEBcblxuICBjbGVhcjogLT5cbiAgICBAJGlucHV0LnZhbChcIlwiKVxuICAgIEBmaWx0ZXIoKVxuICAgIHJldHVybiBAXG5cbiAgZ2V0RmlsdGVyOiAtPlxuICAgIHJldHVybiBAJGlucHV0LnZhbCgpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBvcGluXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50KSAtPlxuICAgIEBpZCA9ICdwb3Bpbi1jb250ZW50LScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgIEAkcGFyZW50ID0gJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cInBvcGluLWNvbnRlbnRcIiAvPicpXG4gICAgQCRlbCA9IEAkcGFyZW50LmZpbmQoJy5wb3Bpbi1jb250ZW50JylcbiAgICBAJGNsb3NlQnRuID0gQCRwYXJlbnQuZmluZCgnLmNsb3NlJylcbiAgICBAJGNsb3NlQnRuLm9uIFwiY2xpY2tcIiwgQGNsb3NlXG5cbiAgICByZXR1cm4gQFxuXG4gIHNldENvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIEAkZWwuaHRtbChjb250ZW50KVxuXG4gICAgcmV0dXJuIEBcblxuICBiaW5kTGlzdDogKCkgPT5cbiAgICBAJHBhcmVudC5hZGRDbGFzcygnc2VhcmNoLWxpc3QnKVxuICAgIEAkcGFyZW50LmZpbmQoJy5zZWFyY2gtaXRlbScpLm9mZiBcImNsaWNrXCJcblxuICAgIEAkcGFyZW50LmZpbmQoJy5zZWFyY2gtaXRlbScpLm9uIFwiY2xpY2tcIiwgKGUpID0+XG4gICAgICBwbGFjZSA9IEAucGxhY2VzWyQoZS50YWdldCkuY2xvc2VzdCgnLnNlYXJjaC1pdGVtJykuYXR0cignZGF0YS1pZCcpXVxuICAgICAgQC5kaXNwbGF5U2luZ2xlKHBsYWNlKVxuXG4gIHNob3c6ICgpID0+XG4gICAgQCRwYXJlbnQuYWRkQ2xhc3MoXCJvcGVuXCIpXG4gICAgQCRwYXJlbnQudHJpZ2dlcihcIm9wZW5cIilcbiAgICByZXR1cm4gQFxuXG4gIGNsb3NlOiAoKSA9PlxuICAgIEAkcGFyZW50LnRyaWdnZXIoXCJjbG9zZVwiKVxuICAgIEAkcGFyZW50LnJlbW92ZUNsYXNzKFwib3BlblwiKVxuXG4gICAgcmV0dXJuIEBcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRmlsdGVyc1xuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGQsIEB0ZW1wbGF0ZSkgLT5cbiAgICBAaWQgPSAnbWFwLWZpbHRlcnMtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cIm1hcC1maWx0ZXJzXCIgLz4nKVxuICAgIEAkZWwgPSAkKCcjJytAaWQpXG4gICAgQHBhcnNlRGF0YSBkYXRhLCBmaWVsZFxuICAgIEBmaWx0ZXIgPSBuZXcgQXJyYXkoKVxuXG4gICAgIyBHZXQgdGVtcGxhdGVzXG4gICAgJC5nZXQoQHRlbXBsYXRlKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoZGF0YSlcbiAgICAgICAgQHJlbmRlcigpXG4gICAgICAgIEAkZmlsdGVyQnRucyA9IEAkZWwuZmluZCgnLm1hcC1maWx0ZXInKVxuICAgICAgICBAJGZpbHRlckJ0bnMub24gXCJjbGlja1wiLCBAc2V0RmlsdGVyXG5cbiAgICByZXR1cm4gQFxuXG4gICMgR2V0IGFsbCB1bmlxdWUgZmllbGQgdmFsdWVzXG4gIHBhcnNlRGF0YTogKGRhdGEsIGZpZWxkKSAtPlxuICAgIEBmaWx0ZXJzID0gbmV3IEFycmF5KClcbiAgICBmb3IgaXRlbSBpbiBkYXRhXG4gICAgICB1bmxlc3MgaXRlbVtmaWVsZF0gaW4gQGZpbHRlcnNcbiAgICAgICAgQGZpbHRlcnMucHVzaCBpdGVtW2ZpZWxkXVxuICAgIHJldHVybiBAXG5cbiAgcmVuZGVyOiAgLT5cbiAgICBAJGVsLmh0bWwoQHRlbXBsYXRlKHtAZmlsdGVyc30pKVxuXG4gIHNldEZpbHRlcjogKGZpbHRlcikgPT5cbiAgICBpZiBmaWx0ZXIgaW5zdGFuY2VvZiBqUXVlcnkuRXZlbnRcbiAgICAgIGZpbHRlci5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBmaWx0ZXIgPSAkKGZpbHRlci50YXJnZXQpLmNsb3Nlc3QoJy5tYXAtZmlsdGVyJykuYXR0cignZGF0YS1maWx0ZXInKVxuXG4gICAgY29uc29sZS5sb2cgZmlsdGVyLCBAZmlsdGVyLmpvaW4oKVxuICAgIGlmIChmaWx0ZXIgPT0gXCJhbGxcIiB8fCBmaWx0ZXIgPT0gQGZpbHRlci5qb2luKCkpXG4gICAgICBAJGZpbHRlckJ0bnMucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIgPSBuZXcgQXJyYXkoKVxuICAgIGVsc2VcbiAgICAgIEAkZmlsdGVyQnRucy5ub3QoJChmaWx0ZXIudGFyZ2V0KS5jbG9zZXN0KCcubWFwLWZpbHRlcicpKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAgICAgJCgnW2RhdGEtZmlsdGVyPVwiJytmaWx0ZXIrJ1wiXScpLmFkZENsYXNzKFwiYWN0aXZlXCIpXG4gICAgICBAZmlsdGVyID0gbmV3IEFycmF5KGZpbHRlcilcblxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAZmlsdGVyfSlcblxuICAgIHJldHVybiBAXG5cbiAgIyBnZXRGaWx0ZXI6ICgpIC0+XG4gICMgICByZXR1cm4gQGZpbHRlclxuICAjXG5cbiAgIyBkaXNwbGF5U2luZ2xlOiAoZGF0YSkgLT5cbiAgIyAgIGNvbnRlbnQgPSBfLnRlbXBsYXRlIEB0ZW1wbGF0ZVNpbmdsZSwgZGF0YVxuICAjICAgQHBvcGluLnNldENvbnRlbnQoY29udGVudClcbiAgIyAgIEBwb3Bpbi5zaG93KClcbiAgI1xuICAjICAgcmV0dXJuIEBcbiAgI1xuICAjIGRpc3BsYXlMaXN0OiAocmVzdWx0cykgLT5cbiAgIyAgIGNvbnRlbnQgPSBcIlwiXG4gICMgICBmb3IgaWQgaW4gcmVzdWx0c1xuICAjICAgICBjb250ZW50ICs9IF8udGVtcGxhdGUgQHRlbXBsYXRlTGlzdCwgQHBsYWNlc1tpZF1cbiAgI1xuICAjICAgQHBvcGluLnNldENvbnRlbnQoY29udGVudClcbiAgIyAgIEBwb3Bpbi5zaG93KClcbiAgIyAgIEBwb3Bpbi5iaW5kTGlzdCgpXG4gICNcbiAgIyAgIHJldHVybiBAXG4iLCIgIG1vZHVsZS5leHBvcnRzID0gY2xhc3MgTWFya2VyIGV4dGVuZHMgZ29vZ2xlLm1hcHMuTWFya2VyXG4gICAgIyBleHRlbmQgdGhlIGdvb2dsZS5tYXBzLk1hcmtlciBvYmplY3QgdG8gbWFuYWdlIGZpbHRlcnNcbiAgICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgICBzdXBlciBhcmdzXG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBAZ2V0TWFwKCksICdzZWFyY2guY2hhbmdlZCcsIEBmaWx0ZXJcblxuICAgIGdldEZpZWxkOiAoZmllbGQpIC0+XG4gICAgICByZXR1cm4gQFtmaWVsZF0udG9TdHJpbmcoKVxuXG4gICAgZmlsdGVyOiAocmVzdWx0cykgPT5cbiAgICAgIGlmICFyZXN1bHRzWzBdLmxlbmd0aCB8fCBAZ2V0RmllbGQocmVzdWx0c1sxXSkgaW4gcmVzdWx0c1swXVxuICAgICAgICBAc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0VmlzaWJsZShmYWxzZSlcbiJdfQ==
;