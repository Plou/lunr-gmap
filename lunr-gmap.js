;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var Filters, Gmap, List, Loader, LunrGmap, Marker, Popin, Search,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Gmap = require('./Gmap.coffee');

  Search = require('./Search.coffee');

  Filters = require('./Filters.coffee');

  Popin = require('./Popin.coffee');

  List = require('./List.coffee');

  Marker = void 0;

  /*
  # LunrGmap
  ## Create a google map view from a feed with lunr search and category navigation
  # Manage initialization, loading and events
  # Handle the display of contents and results list
  */


  module.exports = LunrGmap = (function() {
    function LunrGmap(selector) {
      var _this = this;
      this.selector = selector;
      this.loader = new Loader();
      this.loader.set("feed", false);
      this.loader.set("map", false);
      this.loader.set("list", false);
      this.loader.emmitter.on("load.update", function() {
        if (_this.loader.isLoaded()) {
          return _this.addMarkers(_this.feed);
        }
      });
      this.templates = {
        single: "",
        list: ""
      };
      this.checkDependencies();
      this.$el = $(this.selector);
      if (this.$el.length > 1) {
        throw new Error("selector argument must refer to an unique node");
      }
      this.$el.empty();
      this.templates.single = this.$el.attr('data-templateSingle');
      this.templates.list = this.$el.attr('data-templateList');
      this.fields = this.parseFields(this.$el.attr('data-lunr'));
      this.filter = this.$el.attr('data-filter');
      this.initGmap();
      this.popin = new Popin(this.selector);
      this.list = new List(this.selector, this.templates.list);
      this.list.$el.on("load", function() {
        return _this.loader.set("list", true);
      });
      $.get(this.$el.attr('data-feed')).done(function(data) {
        _this.feed = data;
        _this.initFeed();
        return _this.initFilters();
      });
      $.get(this.templates.single).done(function(data) {
        return _this.templates.single = _.template(data);
      });
    }

    LunrGmap.prototype.initGmap = function() {
      var _this = this;
      this.map = new Gmap(this.selector, this.$el.attr('data-latitude'), this.$el.attr('data-longitude'), parseInt(this.$el.attr('data-zoom')));
      this.map.$el.on("load", function() {
        Marker = require('./Marker.coffee');
        return _this.loader.set("map", true);
      });
      return this;
    };

    LunrGmap.prototype.initFeed = function() {
      var _this = this;
      this.search = new Search(this.selector, this.feed, this.fields);
      this.search.$el.on("search.change", function(e, data) {
        return google.maps.event.trigger(_this.map.gmap, "search.change", [data.refs, "index", "lunr"]);
      });
      this.loader.set("feed", true);
      return this;
    };

    LunrGmap.prototype.initFilters = function() {
      var _this = this;
      this.filters = new Filters(this.selector, this.feed, this.filter, this.$el.attr('data-templateFilters'));
      return this.filters.$el.on("search.change", function(e, data) {
        return google.maps.event.trigger(_this.map.gmap, "search.change", [data.filter, _this.filter, "filters"]);
      });
    };

    LunrGmap.prototype.addMarkers = function(data) {
      var marker, _i, _len;
      this.markers = new Array();
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
      this.list.addMarker(marker);
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

    LunrGmap.prototype.checkDependencies = function() {
      if (typeof $ === "undefined" || $ === null) {
        throw new Error('jQuery not found');
      }
      if (typeof _ === "undefined" || _ === null) {
        throw new Error('underscore not found');
      }
    };

    return LunrGmap;

  })();

  window.LunrGmap = LunrGmap;

  Loader = (function() {
    function Loader() {
      this.set = __bind(this.set, this);
      this.isLoaded = __bind(this.isLoaded, this);
      this.emmitter = $({});
      this.modules = new Object();
    }

    Loader.prototype.isLoaded = function() {
      var module;
      for (module in this.modules) {
        if (!this.modules[module]) {
          return false;
        }
      }
      return true;
    };

    Loader.prototype.set = function(module, value) {
      this.modules[module] = value;
      return this.emmitter.trigger("load.update");
    };

    return Loader;

  })();

}).call(this);


},{"./Gmap.coffee":2,"./Search.coffee":3,"./Filters.coffee":4,"./Popin.coffee":5,"./List.coffee":6,"./Marker.coffee":7}],2:[function(require,module,exports){
/*
# Gmap
## Manage google map initialization and rendering
# Parameters :
#   - parent : The dom selector were the map must be added
#   - latitude : Used to center the map
#   - longitude : Used to center the map
#   - zoom : Zoom used
*/


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
          callback: _this.create
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
/*
# Search
## Manage lunr search engine
# Parameters :
#   - parent : The dom selector were the search field must be added
#   - data : The data to search
#   - fields : The fields to search
#   - event : search input event which trigger the search
#   - score : The minimum score required to show up in results
*/


(function() {
  var Search,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Search = (function() {
    function Search(parent, data, fields, event, score) {
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
      if (!event) {
        event = "keyup";
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
      this.$input.on(event, this.initSearch);
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
/*
# Filters
## Manage filters
# Parameters :
#   - parent : The dom selector were the filter navigation must be added
#   - data : The data to search
#   - fields : The field to filter
#   - @template : The template to build the navigation
*/


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


},{}],5:[function(require,module,exports){
/*
# Popin
## Create a popin
*/


(function() {
  var Popin,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Popin = (function() {
    function Popin(parent) {
      this.close = __bind(this.close, this);
      this.open = __bind(this.open, this);
      this.id = 'popin-content-' + (new Date().getTime());
      this.$parent = $(parent).append('<div id="' + this.id + '" class="popin-content" />');
      this.$el = this.$parent.find('.popin-content');
      this.$closeBtn = $parent.find('.popin-close');
      this.$closeBtn.on("click", this.close);
      return this;
    }

    Popin.prototype.setContent = function(content) {
      this.$el.html(content);
      return this;
    };

    Popin.prototype.open = function() {
      this.$parent.addClass("open");
      this.$parent.removeClass("close");
      this.$parent.trigger("open");
      return this;
    };

    Popin.prototype.close = function() {
      this.$parent.trigger("close");
      this.$parent.addClass("close");
      this.$parent.removeClass("open");
      return this;
    };

    return Popin;

  })();

}).call(this);


},{}],7:[function(require,module,exports){
/*
# Marker
## Extends google.maps.Marker to enable filtering
*/


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
      this.engines = new Object();
      google.maps.event.addListener(this.getMap(), 'search.change', this.filter);
    }

    Marker.prototype.getField = function(field) {
      return this[field].toString();
    };

    Marker.prototype.filter = function(results) {
      var engine, engineId, _ref;
      if (results[2]) {
        engineId = results[2];
      } else {
        throw new Error("The `search.change` pust pass an string identifier as thrid argument");
      }
      if (!this.engines[engineId]) {
        this.engines[engineId] = new Object();
      }
      this.engines[engineId].field = results[1];
      this.engines[engineId].results = results[0];
      for (engineId in this.engines) {
        engine = this.engines[engineId];
        if (!engine.results.length || (_ref = this.getField(engine.field), __indexOf.call(engine.results, _ref) >= 0)) {
          this.setVisible(true);
        } else {
          this.setVisible(false);
          return this;
        }
      }
      return this;
    };

    return Marker;

  })(google.maps.Marker);

}).call(this);


},{}],6:[function(require,module,exports){
(function() {
  var List, Popin,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Popin = require('./Popin.coffee');

  /*
  # List
  ## List Marker
  */


  module.exports = List = (function(_super) {
    __extends(List, _super);

    function List(parent, template) {
      this.close = __bind(this.close, this);
      this.open = __bind(this.open, this);
      var _this = this;
      this.id = 'list-content-' + (new Date().getTime());
      this.$parent = $(parent).append('<div id="' + this.id + '" class="list-content" />');
      this.$el = this.$parent.find('.list-content');
      this.markers = new Array();
      $.get(template).done(function(data) {
        _this.template = _.template(data);
        return _this.$el.trigger("load");
      });
      return this;
    }

    List.prototype.addMarker = function(marker) {
      var _this = this;
      this.markers.push(marker);
      this.render(this.markers);
      return google.maps.event.addListener(marker, 'visible_changed', function(e) {
        if (marker.visible) {
          return _this.showMarker(marker);
        } else {
          return _this.hideMarker(marker);
        }
      });
    };

    List.prototype.showMarker = function(marker) {
      this.$el.find('[data-index="' + marker.getField("index") + '"]').show();
      return this;
    };

    List.prototype.hideMarker = function(marker) {
      this.$el.find('[data-index="' + marker.getField("index") + '"]').hide();
      return this;
    };

    List.prototype.open = function() {
      this.$el.addClass("open");
      this.$el.removeClass("close");
      this.$el.trigger("open");
      return this;
    };

    List.prototype.close = function() {
      this.$el.trigger("close");
      this.$el.addClass("close");
      return this.$el.removeClass("open");
    };

    List.prototype.render = function(markers) {
      this.setContent(this.template({
        markers: markers
      }));
      this.$closeBtn = this.$parent.find('.list-close');
      this.$closeBtn.on("click", this.close);
      if (!this.$el.find('[data-index]').length) {
        throw new Error('The attribute `data-index="<%=marker.index%>` is required in template file" ');
      }
      return this;
    };

    return List;

  })(Popin);

}).call(this);


},{"./Popin.coffee":5}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1BvcGluLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9MaXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLHNEQUFBO0tBQUEsNkVBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxRQUFBOztDQUFQLENBQ0EsQ0FBUyxHQUFULENBQVMsVUFBQTs7Q0FEVCxDQUVBLENBQVUsSUFBVixXQUFVOztDQUZWLENBR0EsQ0FBUSxFQUFSLEVBQVEsU0FBQTs7Q0FIUixDQUlBLENBQU8sQ0FBUCxHQUFPLFFBQUE7O0NBSlAsQ0FLQSxDQUFTLEdBQVQ7O0NBRUE7Ozs7OztDQVBBOztDQUFBLENBY0EsQ0FBdUIsR0FBakIsQ0FBTjtDQUNlLEVBQUEsQ0FBQSxJQUFBLFVBQUU7Q0FFYixTQUFBLEVBQUE7Q0FBQSxFQUZhLENBQUEsRUFBRCxFQUVaO0NBQUEsRUFBYyxDQUFiLEVBQUQ7Q0FBQSxDQUNvQixDQUFwQixDQUFDLENBQUQsQ0FBQTtDQURBLENBRW1CLENBQW5CLENBQUMsQ0FBRCxDQUFBO0NBRkEsQ0FHb0IsQ0FBcEIsQ0FBQyxDQUFELENBQUE7Q0FIQSxDQUtBLENBQW1DLENBQWxDLEVBQUQsRUFBZ0IsQ0FBbUIsSUFBbkM7Q0FFRSxHQUFHLENBQUMs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QUFVO0FBRUgsQ0FBUCxFQUFXLENBQVgsRUFBQSxRQUFPO0NBQ0wsR0FBVSxDQUFBLFNBQUEsZ0VBQUE7UUFMWjtDQU1BLEdBQUEsU0FBTztDQXBEVCxJQTZDUTs7Q0E3Q1I7O0NBRGtDO0NBTnBDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJHbWFwID0gcmVxdWlyZSgnLi9HbWFwLmNvZmZlZScpXG5TZWFyY2ggPSByZXF1aXJlKCcuL1NlYXJjaC5jb2ZmZWUnKVxuRmlsdGVycyA9IHJlcXVpcmUoJy4vRmlsdGVycy5jb2ZmZWUnKVxuUG9waW4gPSByZXF1aXJlKCcuL1BvcGluLmNvZmZlZScpXG5MaXN0ID0gcmVxdWlyZSgnLi9MaXN0LmNvZmZlZScpXG5NYXJrZXIgPSB1bmRlZmluZWRcblxuIyMjXG4jIEx1bnJHbWFwXG4jIyBDcmVhdGUgYSBnb29nbGUgbWFwIHZpZXcgZnJvbSBhIGZlZWQgd2l0aCBsdW5yIHNlYXJjaCBhbmQgY2F0ZWdvcnkgbmF2aWdhdGlvblxuIyBNYW5hZ2UgaW5pdGlhbGl6YXRpb24sIGxvYWRpbmcgYW5kIGV2ZW50c1xuIyBIYW5kbGUgdGhlIGRpc3BsYXkgb2YgY29udGVudHMgYW5kIHJlc3VsdHMgbGlzdFxuIyMjXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTHVuckdtYXBcbiAgY29uc3RydWN0b3I6IChAc2VsZWN0b3IpIC0+XG4gICAgIyBMb2FkZXIgc3RvcmVzIHRoZSBsb2FkIHN0YXRlIG9mIG1hcCBhbmQgZmVlZFxuICAgIEBsb2FkZXIgPSBuZXcgTG9hZGVyKClcbiAgICBAbG9hZGVyLnNldChcImZlZWRcIiwgZmFsc2UpXG4gICAgQGxvYWRlci5zZXQoXCJtYXBcIiwgZmFsc2UpXG4gICAgQGxvYWRlci5zZXQoXCJsaXN0XCIsIGZhbHNlKVxuXG4gICAgQGxvYWRlci5lbW1pdHRlci5vbiBcImxvYWQudXBkYXRlXCIsID0+XG4gICAgICAjIEluaXQgbWFya2VyIGlmIHRoZSBtYXAgaXMgbG9hZGVkXG4gICAgICBpZiBAbG9hZGVyLmlzTG9hZGVkKClcbiAgICAgICAgIyBXZSBjYW4gbm93IGFkZCBtYXJrZXJzIGZyb20gdGhlIGZlZWQgdG8gdGhlIG1hcFxuICAgICAgICBAYWRkTWFya2VycyhAZmVlZClcblxuICAgICMgVW5kZXJzY29yZSB0ZW1wbGF0ZXNcbiAgICBAdGVtcGxhdGVzID1cbiAgICAgIHNpbmdsZTogXCJcIlxuICAgICAgbGlzdDogXCJcIlxuXG4gICAgQGNoZWNrRGVwZW5kZW5jaWVzKCk7XG5cbiAgICAjIFJldHJpZXZlIG9wdGlvbnMgZnJvbWUgZWxlbWVudCBhdHRyaWJ1dGVzXG4gICAgQCRlbCA9ICQoQHNlbGVjdG9yKVxuICAgIGlmIEAkZWwubGVuZ3RoID4gMVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2VsZWN0b3IgYXJndW1lbnQgbXVzdCByZWZlciB0byBhbiB1bmlxdWUgbm9kZVwiKVxuXG4gICAgIyBSZW1vdmUgYWx0ZXJuYXRpdmUgY29udGVudFxuICAgIEAkZWwuZW1wdHkoKVxuXG4gICAgQHRlbXBsYXRlcy5zaW5nbGUgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVTaW5nbGUnKVxuICAgIEB0ZW1wbGF0ZXMubGlzdCA9IEAkZWwuYXR0cignZGF0YS10ZW1wbGF0ZUxpc3QnKVxuICAgIEBmaWVsZHMgPSBAcGFyc2VGaWVsZHMoQCRlbC5hdHRyKCdkYXRhLWx1bnInKSlcbiAgICBAZmlsdGVyID0gQCRlbC5hdHRyKCdkYXRhLWZpbHRlcicpXG5cbiAgICBAaW5pdEdtYXAoKVxuXG4gICAgIyBDcmVhdGUgYSBwb3BpblxuICAgIEBwb3BpbiA9IG5ldyBQb3BpbihAc2VsZWN0b3IpXG5cbiAgICAjIENyZWF0ZSB0aGUgbGlzdCB0byBkaXNwbGF5IHJlc3VsdHNcbiAgICBAbGlzdCA9IG5ldyBMaXN0KEBzZWxlY3RvciwgQHRlbXBsYXRlcy5saXN0KVxuICAgIEBsaXN0LiRlbC5vbiBcImxvYWRcIiwgPT5cbiAgICAgIEBsb2FkZXIuc2V0KFwibGlzdFwiLCB0cnVlKVxuXG4gICAgIyBHZXQgdGhlIGZlZWRcbiAgICAkLmdldChAJGVsLmF0dHIoJ2RhdGEtZmVlZCcpKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEBmZWVkID0gZGF0YVxuICAgICAgICBAaW5pdEZlZWQoKVxuICAgICAgICBAaW5pdEZpbHRlcnMoKVxuXG4gICAgIyBHZXQgdGVtcGxhdGVzXG4gICAgJC5nZXQoQHRlbXBsYXRlcy5zaW5nbGUpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlcy5zaW5nbGUgPSBfLnRlbXBsYXRlKGRhdGEpXG5cblxuICAjICMjIGluaXRHbWFwXG4gIGluaXRHbWFwOiAtPlxuICAgICMgQ3JlYXRlIGEgbmV3IEdtYXAgb2JqZWN0XG4gICAgQG1hcCA9IG5ldyBHbWFwKEBzZWxlY3RvciwgQCRlbC5hdHRyKCdkYXRhLWxhdGl0dWRlJyksIEAkZWwuYXR0cignZGF0YS1sb25naXR1ZGUnKSwgcGFyc2VJbnQoQCRlbC5hdHRyKCdkYXRhLXpvb20nKSkpXG4gICAgIyBMaXN0ZW4gdG8gbWFwIGxvYWRpbmdcbiAgICBAbWFwLiRlbC5vbiBcImxvYWRcIiwgPT5cbiAgICAgICMgT25jZSB0aGUgbWFwIGlzIGxvYWRlZCB3ZSBjYW4gZ2V0IHRoZSBNYXJrZXIgb2JqZWN0IHdoaWNoIGV4dGVuZCBgZ29vZ2xlLm1hcHMuTWFya2VyYFxuICAgICAgTWFya2VyID0gcmVxdWlyZSgnLi9NYXJrZXIuY29mZmVlJylcbiAgICAgIEBsb2FkZXIuc2V0KFwibWFwXCIsIHRydWUpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGluaXRGZWVkXG4gIGluaXRGZWVkOiAoKS0+XG4gICAgIyBJbml0IGx1bnIgc2VhcmNoIGVuZ2luZVxuICAgIEBzZWFyY2ggPSBuZXcgU2VhcmNoKEBzZWxlY3RvciwgQGZlZWQsIEBmaWVsZHMpXG4gICAgIyBPbiBsdW5yIGBzZWFyY2guY2hhbmdlc2Agd2UgdHJpZ2dlciB0aGUgc2FtZSBldmVudCBvbiBtYXBcbiAgICBAc2VhcmNoLiRlbC5vbiBcInNlYXJjaC5jaGFuZ2VcIiwgKGUsIGRhdGEpID0+XG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyIEBtYXAuZ21hcCwgXCJzZWFyY2guY2hhbmdlXCIsIFtkYXRhLnJlZnMsIFwiaW5kZXhcIiwgXCJsdW5yXCJdXG5cbiAgICBAbG9hZGVyLnNldChcImZlZWRcIiwgdHJ1ZSlcblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBpbml0RmlsdGVyc1xuICBpbml0RmlsdGVyczogKCktPlxuICAgIEBmaWx0ZXJzID0gbmV3IEZpbHRlcnMoQHNlbGVjdG9yLCBAZmVlZCwgQGZpbHRlciwgQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlRmlsdGVycycpKVxuICAgICMgT24gZmlsdGVycyBgc2VhcmNoLmNoYW5nZXNgIHdlIHRyaWdnZXIgdGhlIHNhbWUgZXZlbnQgb24gbWFwXG4gICAgQGZpbHRlcnMuJGVsLm9uIFwic2VhcmNoLmNoYW5nZVwiLCAoZSwgZGF0YSkgPT5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VcIiwgW2RhdGEuZmlsdGVyLCBAZmlsdGVyLCBcImZpbHRlcnNcIl1cblxuICAjICMjIGFkZE1hcmtlcnNcbiAgYWRkTWFya2VyczogKGRhdGEpIC0+XG4gICAgQG1hcmtlcnMgPSBuZXcgQXJyYXkoKVxuICAgICMgRm9yIGVhY2ggb2JqZWN0IG9mIHRoZSBmZWVkIHdlIGFkZCBhIG1hcmtlclxuICAgIGZvciBtYXJrZXIgaW4gZGF0YVxuICAgICAgQGFkZE1hcmtlcihtYXJrZXIpXG4gICAgIyBXZSBjcmVhdGUgdGhlIHJlc3VsdCBsaXN0XG4gICAgcmV0dXJuIEBcblxuICAjICMjIGFkZE1hcmtlclxuICBhZGRNYXJrZXI6IChkYXRhKS0+XG4gICAgZGF0YS5wb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoZGF0YS5sYXRpdHVkZSxkYXRhLmxvbmdpdHVkZSlcbiAgICBkYXRhLm1hcCA9IEBtYXAuZ21hcFxuXG4gICAgbWFya2VyID0gbmV3IE1hcmtlcihkYXRhKVxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gICAgQGxpc3QuYWRkTWFya2VyKG1hcmtlcilcblxuICAgICMgTGlzdGVuIHRvIG1hcmtlciBjbGljayBldmVudCB0byBkaXNwbHkgdGhlIG1hcmtlcidzIGNvbnRlbnRcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBtYXJrZXIsICdjbGljaycsICgpID0+XG4gICAgICBAZGlzcGxheVNpbmdsZShtYXJrZXIpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGRpc3BsYXlTaW5nbGVcbiAgZGlzcGxheVNpbmdsZTogKG1hcmtlcikgLT5cbiAgICBAcG9waW4uc2V0Q29udGVudChAdGVtcGxhdGVzLnNpbmdsZShtYXJrZXIpKVxuICAgIHJldHVybiBAXG5cblxuICAjICMjIHBhcnNlRmllbGRzXG4gICMgR2V0IGZpZWxkcyB0byBzZWFyY2ggZnJvbSBgZGF0YS1sdW5yYCBhdHRyaWJ1dGVcbiAgcGFyc2VGaWVsZHM6IChkYXRhKSAtPlxuICAgIGZpZWxkcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIGZpZWxkIGluIGRhdGEuc3BsaXQoJywnKVxuICAgICAgZmllbGQgPSBmaWVsZC5zcGxpdCgnfCcpXG4gICAgICBmaWVsZHMucHVzaChbZmllbGRbMF0sIHBhcnNlSW50KGZpZWxkWzFdKV0pXG4gICAgcmV0dXJuIGZpZWxkc1xuXG4gICMgIyMgY2hlY2tEZXBlbmRlbmNpZXNcbiAgIyBDaGVja3MgaWYgalF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBpbmNsdWRlZFxuICBjaGVja0RlcGVuZGVuY2llczogLT5cbiAgICBpZiAhJD8gdGhlbiB0aHJvdyBuZXcgRXJyb3IoJ2pRdWVyeSBub3QgZm91bmQnKVxuICAgIGlmICFfPyB0aGVuIHRocm93IG5ldyBFcnJvcigndW5kZXJzY29yZSBub3QgZm91bmQnKVxuXG4jIEV4cG9ydCB0aGUgY2xhc3MgdG8gdGhlIGdsb2JhbCBzY29wZVxud2luZG93Lkx1bnJHbWFwID0gTHVuckdtYXBcblxuY2xhc3MgTG9hZGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlbW1pdHRlciA9ICQoe30pXG4gICAgQG1vZHVsZXMgPSBuZXcgT2JqZWN0KClcblxuICBpc0xvYWRlZDogPT5cbiAgICBmb3IgbW9kdWxlIG9mIEBtb2R1bGVzXG4gICAgICB1bmxlc3MgQG1vZHVsZXNbbW9kdWxlXVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHNldDogKG1vZHVsZSwgdmFsdWUpID0+XG4gICAgQG1vZHVsZXNbbW9kdWxlXSA9IHZhbHVlXG4gICAgQGVtbWl0dGVyLnRyaWdnZXIgXCJsb2FkLnVwZGF0ZVwiXG4iLCIjIyNcbiMgR21hcFxuIyMgTWFuYWdlIGdvb2dsZSBtYXAgaW5pdGlhbGl6YXRpb24gYW5kIHJlbmRlcmluZ1xuIyBQYXJhbWV0ZXJzIDpcbiMgICAtIHBhcmVudCA6IFRoZSBkb20gc2VsZWN0b3Igd2VyZSB0aGUgbWFwIG11c3QgYmUgYWRkZWRcbiMgICAtIGxhdGl0dWRlIDogVXNlZCB0byBjZW50ZXIgdGhlIG1hcFxuIyAgIC0gbG9uZ2l0dWRlIDogVXNlZCB0byBjZW50ZXIgdGhlIG1hcFxuIyAgIC0gem9vbSA6IFpvb20gdXNlZFxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEdtYXBcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIEBsYXRpdHVkZSwgQGxvbmdpdHVkZSwgQHpvb20pIC0+XG4gICAgIyBTZXQgYW4gdW5pcXVlIGlkXG4gICAgQGlkID0gJ21hcC1jYW52YXMtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgIyBDcmVhdGUgdGhlIHZpZXcgbm9kZVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtY2FudmFzXCIgLz4nKVxuICAgIEAkZWwgPSAkKCcjJytAaWQpXG5cbiAgICBAem9vbSA9IDQgdW5sZXNzIEB6b29tXG4gICAgQGxvYWRHb29nbGVNYXBzKClcblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBsb2FkR29vZ2xlTWFwc1xuICBsb2FkR29vZ2xlTWFwczogKCkgLT5cbiAgICAjIEdldCB0aGUgZ29vZ2xlIG1hcCBzY3JpcHRcbiAgICAkLmdldFNjcmlwdCAnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaScsID0+XG4gICAgICBnb29nbGUubG9hZCAnbWFwcycsICczJyxcbiAgICAgICAgb3RoZXJfcGFyYW1zOiAnc2Vuc29yPWZhbHNlJ1xuICAgICAgICBjYWxsYmFjazogQGNyZWF0ZVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjcmVhdGVcbiAgY3JlYXRlOiAoKSA9PlxuICAgICMgT3B0aW9uc1xuICAgIHN0eWxlcyA9IFtcbiAgICAgIGZlYXR1cmVUeXBlOiBcInBvaVwiXG4gICAgICBlbGVtZW50VHlwZTogXCJsYWJlbHNcIlxuICAgICAgc3R5bGVyczogW1xuICAgICAgICB2aXNpYmlsaXR5OiBcIm9mZlwiXG4gICAgICBdXG4gICAgXVxuXG4gICAgIyBJbml0aWFsaXplIHRoZSBnb29nbGUgbWFwXG4gICAgQGdtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKEBpZCksXG4gICAgICB6b29tOiBAem9vbSxcbiAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhAbGF0aXR1ZGUsQGxvbmdpdHVkZSlcbiAgICAgIHZpc3VhbFJlZnJlc2g6IHRydWVcbiAgICAgIGRpc2FibGVEZWZhdWx0VUk6IHRydWVcbiAgICAgIHN0eWxlczogc3R5bGVzXG5cbiAgICBAJGVsLnRyaWdnZXIoXCJsb2FkXCIpXG4gICAgcmV0dXJuIEBcbiIsIiMjI1xuIyBTZWFyY2hcbiMjIE1hbmFnZSBsdW5yIHNlYXJjaCBlbmdpbmVcbiMgUGFyYW1ldGVycyA6XG4jICAgLSBwYXJlbnQgOiBUaGUgZG9tIHNlbGVjdG9yIHdlcmUgdGhlIHNlYXJjaCBmaWVsZCBtdXN0IGJlIGFkZGVkXG4jICAgLSBkYXRhIDogVGhlIGRhdGEgdG8gc2VhcmNoXG4jICAgLSBmaWVsZHMgOiBUaGUgZmllbGRzIHRvIHNlYXJjaFxuIyAgIC0gZXZlbnQgOiBzZWFyY2ggaW5wdXQgZXZlbnQgd2hpY2ggdHJpZ2dlciB0aGUgc2VhcmNoXG4jICAgLSBzY29yZSA6IFRoZSBtaW5pbXVtIHNjb3JlIHJlcXVpcmVkIHRvIHNob3cgdXAgaW4gcmVzdWx0c1xuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlYXJjaFxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGRzLCBldmVudCwgc2NvcmUpIC0+XG4gICAgIyBDcmVhdGUgdGhlIHNlYXJjaCBmaWVsZFxuICAgIEAkZWwgPSAkKCc8ZGl2IGNsYXNzPVwibWFwLXNlYXJjaFwiIC8+JylcbiAgICAkKHBhcmVudCkuYXBwZW5kKEAkZWwpXG4gICAgQCRpbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIC8+JylcbiAgICBAJGVsLmFwcGVuZChAJGlucHV0KVxuXG4gICAgQHJlZnMgPSBAcmVzdWx0cyA9IG5ldyBBcnJheSgpXG4gICAgQHNjb3JlID0gMCB1bmxlc3Mgc2NvcmVcbiAgICBldmVudCA9IFwia2V5dXBcIiB1bmxlc3MgZXZlbnRcblxuICAgICMgSW5pdGlhbGl6ZSBsdW5yIGZpZWxkc1xuICAgIEBpbmRleCA9IGx1bnIgLT5cbiAgICAgIGZvciBmaWVsZCBpbiBmaWVsZHNcbiAgICAgICAgdGhpcy5maWVsZChmaWVsZFswXSwgZmllbGRbMV0pXG4gICAgICAgIHRoaXMucmVmKCdpbmRleCcpXG5cbiAgICBAJGlucHV0Lm9uIGV2ZW50LCBAaW5pdFNlYXJjaFxuXG4gICAgIyBhZGQgb2JqZWN0cyB0byBsdW5yXG4gICAgaWYgZGF0YT9cbiAgICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgICAgQGluZGV4LmFkZChpdGVtKVxuXG4gICAgQCRlbC50cmlnZ2VyKCdyZWFkeScpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGluaXRTZWFyY2hcbiAgaW5pdFNlYXJjaDogKCkgPT5cbiAgICBAZmlsdGVyKClcbiAgICBAJGVsLnRyaWdnZXIoJ3NlYXJjaC5jaGFuZ2UnLCB7QHJlZnN9KVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBnZXRSZXN1bHRzXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmV0dXJuIEByZXN1bHRzXG5cbiAgIyAjIyBnZXRSZWZzXG4gIGdldFJlZnM6ICgpIC0+XG4gICAgcmV0dXJuIEByZWZzXG5cbiAgIyAjIyBmaWx0ZXJcbiAgZmlsdGVyOiAtPlxuICAgIEByZXN1bHRzID0gQGluZGV4LnNlYXJjaChAZ2V0RmlsdGVyKCkpXG4gICAgQHJlZnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciByZXN1bHQgaW4gQHJlc3VsdHNcbiAgICAgIGlmIHJlc3VsdC5zY29yZSA+PSBAc2NvcmVcbiAgICAgICAgQHJlZnMucHVzaChyZXN1bHQucmVmKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjbGVhclxuICBjbGVhcjogLT5cbiAgICBAJGlucHV0LnZhbChcIlwiKVxuICAgIEBmaWx0ZXIoKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBnZXRGaWx0ZXJcbiAgIyBSZXR1cm4gdGhlIHNlYXJjaCBzdHJpbmdcbiAgZ2V0RmlsdGVyOiAtPlxuICAgIHJldHVybiBAJGlucHV0LnZhbCgpXG4iLCIjIyNcbiMgRmlsdGVyc1xuIyMgTWFuYWdlIGZpbHRlcnNcbiMgUGFyYW1ldGVycyA6XG4jICAgLSBwYXJlbnQgOiBUaGUgZG9tIHNlbGVjdG9yIHdlcmUgdGhlIGZpbHRlciBuYXZpZ2F0aW9uIG11c3QgYmUgYWRkZWRcbiMgICAtIGRhdGEgOiBUaGUgZGF0YSB0byBzZWFyY2hcbiMgICAtIGZpZWxkcyA6IFRoZSBmaWVsZCB0byBmaWx0ZXJcbiMgICAtIEB0ZW1wbGF0ZSA6IFRoZSB0ZW1wbGF0ZSB0byBidWlsZCB0aGUgbmF2aWdhdGlvblxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZpbHRlcnNcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIGRhdGEsIGZpZWxkLCBAdGVtcGxhdGUpIC0+XG4gICAgIyBTZXQgYW4gdW5pcXVlIGlkXG4gICAgQGlkID0gJ21hcC1maWx0ZXJzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICMgQ3JlYXRlIHRoZSB2aWV3IG5vZGVcbiAgICAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwibWFwLWZpbHRlcnNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcblxuICAgIEBwYXJzZURhdGEgZGF0YSwgZmllbGRcbiAgICBAZmlsdGVyID0gbmV3IEFycmF5KClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGUgPSBfLnRlbXBsYXRlKGRhdGEpXG4gICAgICAgIEByZW5kZXIoKVxuICAgICAgICAjIGdldCBhbGwgbmF2aWdhdGlvbiBpdGVtcyAoZmlsdGVycykgYW5kIGJpbmQgY2xpY2tzXG4gICAgICAgIEAkZmlsdGVyQnRucyA9IEAkZWwuZmluZCgnLm1hcC1maWx0ZXInKVxuICAgICAgICBAJGZpbHRlckJ0bnMub24gXCJjbGlja1wiLCBAc2V0RmlsdGVyXG5cbiAgICByZXR1cm4gQFxuXG4gICMgIyMgcGFyc2VEYXRhXG4gICMgR2V0IGFsbCB1bmlxdWUgZmllbGQgdmFsdWVzXG4gIHBhcnNlRGF0YTogKGRhdGEsIGZpZWxkKSAtPlxuICAgIEBmaWx0ZXJzID0gbmV3IEFycmF5KClcbiAgICBmb3IgaXRlbSBpbiBkYXRhXG4gICAgICB1bmxlc3MgaXRlbVtmaWVsZF0gaW4gQGZpbHRlcnNcbiAgICAgICAgQGZpbHRlcnMucHVzaCBpdGVtW2ZpZWxkXVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyByZW5kZXJcbiAgIyBDcmVhdGUgdGhlIG5hdmlnYXRpb24gZnJvbSBmaWx0ZXJzXG4gIHJlbmRlcjogIC0+XG4gICAgQCRlbC5odG1sKEB0ZW1wbGF0ZSh7QGZpbHRlcnN9KSlcblxuICAjICMjIHNldEZpbHRlclxuICAjICMjIEVuYWJsZS9kaXNhYmxlIGEgZmlsdGVyXG4gIHNldEZpbHRlcjogKGZpbHRlcikgPT5cbiAgICBpZiBmaWx0ZXIgaW5zdGFuY2VvZiBqUXVlcnkuRXZlbnRcbiAgICAgIGZpbHRlci5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAkZmlsdGVyID0gJChmaWx0ZXIudGFyZ2V0KS5jbG9zZXN0KCcubWFwLWZpbHRlcicpXG4gICAgICBmaWx0ZXIgPSAkZmlsdGVyLmF0dHIoJ2RhdGEtZmlsdGVyJylcblxuICAgIGlmIChmaWx0ZXIgPT0gXCJhbGxcIiB8fCBmaWx0ZXIgaW4gQGZpbHRlcilcbiAgICAgICRmaWx0ZXIucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIuc3BsaWNlKEBmaWx0ZXIuaW5kZXhPZihmaWx0ZXIpLCAxKVxuICAgIGVsc2VcbiAgICAgICRmaWx0ZXIuYWRkQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIucHVzaChmaWx0ZXIpXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3NlYXJjaC5jaGFuZ2UnLCB7QGZpbHRlcn0pXG5cbiAgICByZXR1cm4gQFxuIiwiIyMjXG4jIFBvcGluXG4jIyBDcmVhdGUgYSBwb3BpblxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBvcGluXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50KSAtPlxuICAgIEBpZCA9ICdwb3Bpbi1jb250ZW50LScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgIEAkcGFyZW50ID0gJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cInBvcGluLWNvbnRlbnRcIiAvPicpXG4gICAgQCRlbCA9IEAkcGFyZW50LmZpbmQoJy5wb3Bpbi1jb250ZW50JylcbiAgICBAJGNsb3NlQnRuID0gJHBhcmVudC5maW5kKCcucG9waW4tY2xvc2UnKVxuICAgIEAkY2xvc2VCdG4ub24gXCJjbGlja1wiLCBAY2xvc2VcblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBzZXRDb250ZW50XG4gIHNldENvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIEAkZWwuaHRtbChjb250ZW50KVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBzaG93XG4gIG9wZW46ICgpID0+XG4gICAgQCRwYXJlbnQuYWRkQ2xhc3MoXCJvcGVuXCIpXG4gICAgQCRwYXJlbnQucmVtb3ZlQ2xhc3MoXCJjbG9zZVwiKVxuICAgIEAkcGFyZW50LnRyaWdnZXIoXCJvcGVuXCIpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGNsb3NlXG4gIGNsb3NlOiAoKSA9PlxuICAgIEAkcGFyZW50LnRyaWdnZXIoXCJjbG9zZVwiKVxuICAgIEAkcGFyZW50LmFkZENsYXNzKFwiY2xvc2VcIilcbiAgICBAJHBhcmVudC5yZW1vdmVDbGFzcyhcIm9wZW5cIilcblxuICAgIHJldHVybiBAXG4iLCIjIyNcbiMgTWFya2VyXG4jIyBFeHRlbmRzIGdvb2dsZS5tYXBzLk1hcmtlciB0byBlbmFibGUgZmlsdGVyaW5nXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTWFya2VyIGV4dGVuZHMgZ29vZ2xlLm1hcHMuTWFya2VyXG4gIGNvbnN0cnVjdG9yOiAoYXJncykgLT5cbiAgICBzdXBlciBhcmdzXG5cbiAgICBAZW5naW5lcyA9IG5ldyBPYmplY3QoKVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgQGdldE1hcCgpLCAnc2VhcmNoLmNoYW5nZScsIEBmaWx0ZXJcblxuICAjICMjIGdldEZpZWxkXG4gIGdldEZpZWxkOiAoZmllbGQpIC0+XG4gICAgcmV0dXJuIEBbZmllbGRdLnRvU3RyaW5nKClcblxuICAjICMjIGZpbHRlclxuICBmaWx0ZXI6IChyZXN1bHRzKSA9PlxuICAgICMgZ2V0IHRoZSBlbmdpbmUgaW5kZW50aWZpZXJcbiAgICBpZiByZXN1bHRzWzJdXG4gICAgICBlbmdpbmVJZCA9IHJlc3VsdHNbMl1cbiAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIlRoZSBgc2VhcmNoLmNoYW5nZWAgcHVzdCBwYXNzIGFuIHN0cmluZyBpZGVudGlmaWVyIGFzIHRocmlkIGFyZ3VtZW50XCIpXG5cbiAgICAjIFJlZ2lzdGVyIHRoZSBlbmdpbmUgb24gdGhlIGZpcnN0IGZpbHRlclxuICAgIHVubGVzcyBAZW5naW5lc1tlbmdpbmVJZF1cbiAgICAgIEBlbmdpbmVzW2VuZ2luZUlkXSA9IG5ldyBPYmplY3QoKVxuXG4gICAgQGVuZ2luZXNbZW5naW5lSWRdLmZpZWxkID0gcmVzdWx0c1sxXVxuICAgIEBlbmdpbmVzW2VuZ2luZUlkXS5yZXN1bHRzID0gcmVzdWx0c1swXVxuXG4gICAgZm9yIGVuZ2luZUlkIG9mIEBlbmdpbmVzXG4gICAgICBlbmdpbmUgPSBAZW5naW5lc1tlbmdpbmVJZF1cbiAgICAgIGlmICFlbmdpbmUucmVzdWx0cy5sZW5ndGggfHwgQGdldEZpZWxkKGVuZ2luZS5maWVsZCkgaW4gZW5naW5lLnJlc3VsdHNcbiAgICAgICAgQHNldFZpc2libGUodHJ1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldFZpc2libGUoZmFsc2UpXG4gICAgICAgIHJldHVybiBAXG4gICAgcmV0dXJuIEAiLCJQb3BpbiA9IHJlcXVpcmUoJy4vUG9waW4uY29mZmVlJylcblxuIyMjXG4jIExpc3RcbiMjIExpc3QgTWFya2VyXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGlzdCBleHRlbmRzIFBvcGluXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCB0ZW1wbGF0ZSkgLT5cbiAgICBAaWQgPSAnbGlzdC1jb250ZW50LScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgIEAkcGFyZW50ID0gJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cImxpc3QtY29udGVudFwiIC8+JylcbiAgICBAJGVsID0gQCRwYXJlbnQuZmluZCgnLmxpc3QtY29udGVudCcpXG4gICAgQG1hcmtlcnMgPSBuZXcgQXJyYXkoKVxuXG4gICAgJC5nZXQodGVtcGxhdGUpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlID0gXy50ZW1wbGF0ZShkYXRhKVxuICAgICAgICBAJGVsLnRyaWdnZXIgXCJsb2FkXCJcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgYWRkTWFya2VyXG4gIGFkZE1hcmtlcjogKG1hcmtlcikgLT5cbiAgICBAbWFya2Vycy5wdXNoKG1hcmtlcilcbiAgICBAcmVuZGVyKEBtYXJrZXJzKVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgbWFya2VyLCAndmlzaWJsZV9jaGFuZ2VkJywgKGUpID0+XG4gICAgICBpZiBtYXJrZXIudmlzaWJsZSB0aGVuIEBzaG93TWFya2VyKG1hcmtlcikgZWxzZSBAaGlkZU1hcmtlcihtYXJrZXIpXG5cbiAgIyAjIyBzaG93TWFya2VyXG4gIHNob3dNYXJrZXI6IChtYXJrZXIpIC0+XG4gICAgQCRlbC5maW5kKCdbZGF0YS1pbmRleD1cIicrbWFya2VyLmdldEZpZWxkKFwiaW5kZXhcIikrJ1wiXScpLnNob3coKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyByZW5kZXJcbiAgaGlkZU1hcmtlcjogKG1hcmtlcikgLT5cbiAgICBAJGVsLmZpbmQoJ1tkYXRhLWluZGV4PVwiJyttYXJrZXIuZ2V0RmllbGQoXCJpbmRleFwiKSsnXCJdJykuaGlkZSgpXG4gICAgcmV0dXJuIEBcblxuXG4gICMgIyMgc2hvd1xuICBvcGVuOiAoKSA9PlxuICAgIEAkZWwuYWRkQ2xhc3MoXCJvcGVuXCIpXG4gICAgQCRlbC5yZW1vdmVDbGFzcyhcImNsb3NlXCIpXG4gICAgQCRlbC50cmlnZ2VyKFwib3BlblwiKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjbG9zZVxuICBjbG9zZTogKCkgPT5cbiAgICBAJGVsLnRyaWdnZXIoXCJjbG9zZVwiKVxuICAgIEAkZWwuYWRkQ2xhc3MoXCJjbG9zZVwiKVxuICAgIEAkZWwucmVtb3ZlQ2xhc3MoXCJvcGVuXCIpXG5cbiAgIyAjIyByZW5kZXJcbiAgcmVuZGVyOiAobWFya2VycykgLT5cbiAgICBAc2V0Q29udGVudChAdGVtcGxhdGUobWFya2VyczogbWFya2VycykpXG4gICAgQCRjbG9zZUJ0biA9IEAkcGFyZW50LmZpbmQoJy5saXN0LWNsb3NlJylcbiAgICBAJGNsb3NlQnRuLm9uIFwiY2xpY2tcIiwgQGNsb3NlXG5cbiAgICB1bmxlc3MgQCRlbC5maW5kKCdbZGF0YS1pbmRleF0nKS5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGF0dHJpYnV0ZSBgZGF0YS1pbmRleD1cIjwlPW1hcmtlci5pbmRleCU+YCBpcyByZXF1aXJlZCBpbiB0ZW1wbGF0ZSBmaWxlXCIgJylcbiAgICByZXR1cm4gQFxuIl19
;