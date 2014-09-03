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
      this.$closeBtn = this.$parent.find('.close');
      this.$closeBtn.on("click", this.close);
      return this;
    }

    Popin.prototype.setContent = function(content) {
      this.$el.html(content);
      return this;
    };

    Popin.prototype.open = function() {
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


},{}],6:[function(require,module,exports){
(function() {
  var List, Popin,
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
      var _this = this;
      this.id = 'list-content-' + (new Date().getTime());
      this.$parent = $(parent).append('<div id="' + this.id + '" class="list-content" />');
      this.$el = this.$parent.find('.list-content');
      this.$closeBtn = this.$parent.find('.close');
      this.$closeBtn.on("click", this.close);
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

    List.prototype.render = function(markers) {
      this.setContent(this.template({
        markers: markers
      }));
      if (!this.$el.find('[data-index]').length) {
        throw new Error('The attribute `data-index="<%=marker.index%>` is required in template file" ');
      }
      return this;
    };

    return List;

  })(Popin);

}).call(this);


},{"./Popin.coffee":5}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9MaXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLHNEQUFBO0tBQUEsNkVBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxRQUFBOztDQUFQLENBQ0EsQ0FBUyxHQUFULENBQVMsVUFBQTs7Q0FEVCxDQUVBLENBQVUsSUFBVixXQUFVOztDQUZWLENBR0EsQ0FBUSxFQUFSLEVBQVEsU0FBQTs7Q0FIUixDQUlBLENBQU8sQ0FBUCxHQUFPLFFBQUE7O0NBSlAsQ0FLQSxDQUFTLEdBQVQ7O0NBRUE7Ozs7OztDQVBBOztDQUFBLENBY0EsQ0FBdUIsR0FBakIsQ0FBTjtDQUNlLEVBQUEsQ0FBQSxJQUFBLFVBQUU7Q0FFYixTQUFBLEVBQUE7Q0FBQSxFQUZhLENBQUEsRUFBRCxFQUVaO0NBQUEsRUFBYyxDQUFiLEVBQUQ7Q0FBQSxDQUNvQixDQUFwQixDQUFDLENBQUQsQ0FBQTtDQURBLENBRW1CLENBQW5CLENBQUMsQ0FBRCxDQUFBO0NBRkEsQ0FHb0IsQ0FBcEIsQ0FBQyxDQUFELENBQUE7Q0FIQSxDQUtBLENBQW1DLENBQWxDLEVBQUQsRUFBZ0IsQ0FBbUIsSUFBbkM7Q0FFRSxHQUFHLENBQUMsQ0FBTSxFQUFWO0NBRUcsR0FBRCxDQUFDLEtBQUQsT0FBQTtVQUorQjtDQUFuQyxNQUFtQztDQUxuQyxFQWFFLENBREQsRUFBRCxHQUFBO0NBQ0UsQ0FBUSxJQUFSLEVBQUE7Q0FBQSxDQUNNLEVBQU4sSUFBQTtDQWRGLE9BQUE7Q0FBQSxHQWdCQyxFQUFELFdBQUE7Q0FoQkEsRUFtQkEsQ0FBQyxFQUFELEVBQU87Q0FDUCxFQUFPLENBQUosRUFBSDtDQUNFLEdBQVUsQ0FBQSxTQUFBLGtDQUFBO1FBckJaO0NBQUEsRUF3QkksQ0FBSCxDQUFELENBQUE7Q0F4QkEsRUEwQm9CLENBQW5CLEVBQUQsR0FBVSxZQUFVO0NBMUJwQixFQTJCa0IsQ0FBakIsRUFBRCxHQUFVLFVBQVE7Q0EzQmxCLEVBNEJVLENBQVQsRUFBRCxLQUFVO0NBNUJWLEVBNkJVLENBQVQsRUFBRCxPQUFVO0NBN0JWLEdBK0JDLEVBQUQsRUFBQTtDQS9CQSxFQWtDYSxDQUFaLENBQUQsQ0FBQSxFQUFhO0NBbENiLENBcUM0QixDQUFoQixDQUFYLEVBQUQsRUFBWSxDQUEwQjtDQXJDdEMsQ0FzQ0EsQ0FBUyxDQUFSLEVBQUQsR0FBcUI7Q0FDbEIsQ0FBbUIsQ0FBcEIsQ0FBQSxDQUFDLENBQU0sU0FBUDtDQURGLE1BQXFCO0NBdENyQixFQTBDQSxDQUFPLEVBQVAsR0FDUyxFQURIO0NBRUYsRUFBUSxDQUFSLENBQUMsR0FBRDtDQUFBLElBQ0MsR0FBRDtDQUNDLElBQUEsTUFBRCxJQUFBO0NBSkosTUFDUTtDQTNDUixFQWlEQSxDQUFPLEVBQVAsR0FBZ0I7Q0FFWCxFQUFtQixDQUFBLENBQW5CLENBQUQsRUFBb0IsQ0FBVixNQUFWO0NBRkosTUFDUTtDQXBEVixJQUFhOztDQUFiLEVBeURVLEtBQVYsQ0FBVTtDQUVSLFNBQUEsRUFBQTtDQUFBLENBQTJCLENBQTNCLENBQUMsRUFBRCxFQUFXLEdBQWtGLElBQWxFLENBQTRCO0NBQXZELENBRUEsQ0FBSSxDQUFILEVBQUQsR0FBb0I7Q0FFbEIsRUFBUyxHQUFULENBQVMsQ0FBVCxTQUFTO0NBQ1IsQ0FBa0IsQ0FBbkIsQ0FBQSxDQUFDLENBQU0sU0FBUDtDQUhGLE1BQW9CO0NBSXBCLEdBQUEsU0FBTztDQWpFVCxJQXlEVTs7Q0F6RFYsRUFvRVUsS0FBVixDQUFVO0NBRVIsU0FBQSxFQUFBO0NBQUEsQ0FBZ0MsQ0FBbEIsQ0FBYixFQUFELEVBQWM7Q0FBZCxDQUVBLENBQVcsQ0FBVixFQUFELEdBQWlDLE1BQWpDO0NBQ1MsQ0FBOEIsQ0FBUCxDQUFuQixDQUFNLENBQVgsQ0FBTixRQUFBO0NBREYsTUFBZ0M7Q0FGaEMsQ0FLb0IsQ0FBcEIsQ0FBQyxFQUFEO0NBRUEsR0FBQSxTQUFPO0NBN0VULElBb0VVOztDQXBFVixFQWdGYSxNQUFBLEVBQWI7Q0FDRSxTQUFBLEVBQUE7Q0FBQSxDQUFrQyxDQUFuQixDQUFkLEVBQUQsQ0FBQSxDQUFlLGNBQW1DO0NBRWpELENBQUQsQ0FBWSxDQUFYLEdBQU8sRUFBMEIsSUFBbEMsRUFBQTtDQUNTLENBQThCLENBQVAsQ0FBbkIsQ0FBTSxDQUFYLENBQU4sRUFBc0QsTUFBdEQ7Q0FERixNQUFpQztDQW5GbkMsSUFnRmE7O0NBaEZiLEVBdUZZLENBQUEsS0FBQyxDQUFiO0NBQ0UsU0FBQSxNQUFBO0NBQUEsRUFBZSxDQUFkLENBQWMsQ0FBZixDQUFBO0FBRUEsQ0FBQSxVQUFBLGdDQUFBOzJCQUFBO0NBQ0UsR0FBQyxFQUFELEVBQUEsQ0FBQTtDQURGLE1BRkE7Q0FLQSxHQUFBLFNBQU87Q0E3RlQsSUF1Rlk7O0NBdkZaLEVBZ0dXLENBQUEsS0FBWDtDQUNFLEtBQUEsSUFBQTtTQUFBLEdBQUE7Q0FBQSxDQUFxRCxDQUFqQyxDQUFoQixFQUFKLEVBQUEsQ0FBb0I7Q0FBcEIsRUFDQSxDQUFJLEVBQUo7Q0FEQSxFQUdhLENBQUEsRUFBYjtDQUhBLEdBSUMsRUFBRCxDQUFRO0NBSlIsR0FNQyxFQUFELEdBQUE7Q0FOQSxDQVNzQyxDQUFTLENBQXBDLENBQU0sQ0FBakIsQ0FBQSxFQUErQyxFQUEvQztDQUNHLElBQUEsQ0FBRCxPQUFBLEVBQUE7Q0FERixNQUErQztDQUUvQyxHQUFBLFNBQU87Q0E1R1QsSUFnR1c7O0NBaEdYLEVBK0dlLEdBQUEsR0FBQyxJQUFoQjtDQUNFLEdBQUMsQ0FBSyxDQUFOLEdBQTRCLENBQTVCO0NBQ0EsR0FBQSxTQUFPO0NBakhULElBK0dlOztDQS9HZixFQXNIYSxDQUFBLEtBQUMsRUFBZDtDQUNFLFNBQUEsbUJBQUE7Q0FBQSxFQUFhLENBQUEsQ0FBQSxDQUFiO0NBQ0E7Q0FBQSxVQUFBLGdDQUFBOzBCQUFBO0NBQ0UsRUFBUSxFQUFSLEdBQUE7Q0FBQSxDQUN1QixFQUF2QixDQUFtQixDQUFiLEVBQU47Q0FGRixNQURBO0NBSUEsS0FBQSxPQUFPO0NBM0hULElBc0hhOztDQXRIYixFQStIbUIsTUFBQSxRQUFuQjtDQUNFLEdBQUksRUFBSixnQ0FBQTtDQUFZLEdBQVUsQ0FBQSxTQUFBLElBQUE7UUFBdEI7Q0FDQSxHQUFJLEVBQUosZ0NBQUE7Q0FBWSxHQUFVLENBQUEsU0FBQSxRQUFBO1FBRkw7Q0EvSG5CLElBK0htQjs7Q0EvSG5COztDQWZGOztDQUFBLENBbUpBLENBQWtCLEdBQVosRUFBTjs7Q0FuSkEsQ0FxSk07Q0FDUyxFQUFBLENBQUEsWUFBQTtDQUNYLGdDQUFBO0NBQUEsMENBQUE7Q0FBQSxDQUFZLENBQUEsQ0FBWCxFQUFELEVBQUE7Q0FBQSxFQUNlLENBQWQsRUFBRCxDQUFBO0NBRkYsSUFBYTs7Q0FBYixFQUlVLEtBQVYsQ0FBVTtDQUNSLEtBQUEsSUFBQTtBQUFBLENBQUEsRUFBQSxRQUFBLFdBQUE7QUFDUyxDQUFQLEdBQUEsRUFBZ0IsQ0FBQSxDQUFoQjtDQUNFLElBQUEsWUFBTztVQUZYO0NBQUEsTUFBQTtDQUdBLEdBQUEsU0FBTztDQVJULElBSVU7O0NBSlYsQ0FVYyxDQUFkLEVBQUssQ0FBQSxHQUFDO0NBQ0osRUFBbUIsQ0FBbEIsQ0FBRCxDQUFBLENBQVM7Q0FDUixHQUFBLEdBQUQsQ0FBUyxLQUFUO0NBWkYsSUFVSzs7Q0FWTDs7Q0F0SkY7Q0FBQTs7Ozs7QUNBQTs7Ozs7Ozs7O0NBQUE7Q0FBQTtDQUFBO0NBQUEsR0FBQSxFQUFBO0tBQUEsNkVBQUE7O0NBQUEsQ0FTQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsQ0FBVSxDQUFWLENBQUEsRUFBQSxFQUFBLENBQUEsS0FBQztDQUVaLEVBRnFCLENBQUEsRUFBRCxFQUVwQjtDQUFBLEVBRmdDLENBQUEsRUFBRCxHQUUvQjtDQUFBLEVBRjRDLENBQUEsRUFBRDtDQUUzQyxzQ0FBQTtDQUFBLENBQUEsQ0FBTSxDQUFMLEVBQUQsQ0FBeUIsTUFBbkI7Q0FBTixDQUVpQixDQUFZLENBQUMsRUFBOUIsS0FBaUIsY0FBakI7Q0FGQSxDQUdPLENBQVAsQ0FBQyxFQUFEO0FBRWlCLENBQWpCLEdBQUEsRUFBQTtDQUFBLEVBQVEsQ0FBUCxJQUFEO1FBTEE7Q0FBQSxHQU1DLEVBQUQsUUFBQTtDQUVBLEdBQUEsU0FBTztDQVZULElBQWE7O0NBQWIsRUFhZ0IsTUFBQSxLQUFoQjtDQUVFLFNBQUEsRUFBQTtDQUFBLENBQTRDLENBQUEsR0FBNUMsR0FBQSxxQkFBQTtDQUNTLENBQWEsQ0FBcEIsQ0FBQSxFQUFNLFNBQU47Q0FDRSxDQUFjLFFBQWQsRUFBQSxFQUFBO0NBQUEsQ0FDVSxHQUFDLENBRFgsRUFDQSxFQUFBO0NBSHdDLFNBQzFDO0NBREYsTUFBNEM7Q0FJNUMsR0FBQSxTQUFPO0NBbkJULElBYWdCOztDQWJoQixFQXNCUSxHQUFSLEdBQVE7Q0FFTixLQUFBLElBQUE7Q0FBQSxFQUFTLEdBQVQ7U0FDRTtDQUFBLENBQWEsR0FBYixLQUFBLENBQUE7Q0FBQSxDQUNhLE1BRGIsRUFDQSxDQUFBO0NBREEsQ0FFUyxLQUFULEdBQUE7YUFDRTtDQUFBLENBQVksR0FBWixLQUFBLElBQUE7Y0FETztZQUZUO1VBRE87Q0FBVCxPQUFBO0NBQUEsQ0FTNEIsQ0FBaEIsQ0FBWCxFQUFELEVBQW9DLE1BQVI7Q0FDMUIsQ0FBTSxFQUFOLElBQUE7Q0FBQSxDQUNZLEVBQUEsRUFBWixFQUFBLENBQVk7Q0FEWixDQUVlLEVBRmYsSUFFQSxLQUFBO0NBRkEsQ0FHa0IsRUFIbEIsSUFHQSxRQUFBO0NBSEEsQ0FJUSxJQUFSLEVBQUE7Q0FkRixPQVNZO0NBVFosRUFnQkksQ0FBSCxFQUFELENBQUE7Q0FDQSxHQUFBLFNBQU87Q0F6Q1QsSUFzQlE7O0NBdEJSOztDQVZGO0NBQUE7Ozs7O0FDQUE7Ozs7Ozs7Ozs7Q0FBQTtDQUFBO0NBQUE7Q0FBQSxLQUFBO0tBQUEsNkVBQUE7O0NBQUEsQ0FVQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsQ0FBUyxDQUFULENBQUEsQ0FBQSxDQUFBLFVBQUM7Q0FFWiw4Q0FBQTtDQUFBLFNBQUEsSUFBQTtDQUFBLEVBQUEsQ0FBQyxFQUFELHNCQUFPO0NBQVAsRUFDQSxDQUFrQixFQUFsQjtDQURBLEVBRVUsQ0FBVCxFQUFELGlCQUFVO0NBRlYsRUFHSSxDQUFILEVBQUQ7Q0FIQSxFQUtRLENBQVAsQ0FBc0IsQ0FBdkIsQ0FBUTtBQUNVLENBQWxCLEdBQUEsQ0FBQSxDQUFBO0NBQUEsRUFBUyxDQUFSLENBQUQsR0FBQTtRQU5BO0FBT3VCLENBQXZCLEdBQUEsQ0FBQSxDQUFBO0NBQUEsRUFBUSxFQUFSLEVBQUEsQ0FBQTtRQVBBO0NBQUEsRUFVUyxDQUFSLENBQUQsQ0FBQSxHQUFjO0NBQ1osV0FBQSxhQUFBO0FBQUEsQ0FBQTtjQUFBLCtCQUFBOzhCQUFBO0NBQ0UsQ0FBcUIsRUFBakIsQ0FBSixLQUFBO0NBQUEsRUFDQSxDQUFJLEdBQUo7Q0FGRjt5QkFEWTtDQUFMLE1BQUs7Q0FWZCxDQWVBLEVBQUMsQ0FBRCxDQUFBLElBQUE7Q0FHQSxHQUFHLEVBQUgsTUFBQTtBQUNFLENBQUEsWUFBQSw4QkFBQTsyQkFBQTtDQUNFLEVBQUEsQ0FBQyxDQUFLLEtBQU47Q0FERixRQURGO1FBbEJBO0NBQUEsRUFzQkksQ0FBSCxFQUFELENBQUE7Q0FDQSxHQUFBLFNBQU87Q0F6QlQsSUFBYTs7Q0FBYixFQTRCWSxNQUFBLENBQVo7Q0FDRSxHQUFDLEVBQUQ7Q0FBQSxDQUM4QixDQUExQixDQUFILEVBQUQsQ0FBQSxRQUFBO0NBQThCLENBQUMsRUFBQyxJQUFBO0NBRGhDLE9BQ0E7Q0FDQSxHQUFBLFNBQU87Q0EvQlQsSUE0Qlk7O0NBNUJaLEVBa0NZLE1BQUEsQ0FBWjtDQUNFLEdBQVEsR0FBUixNQUFPO0NBbkNULElBa0NZOztDQWxDWixFQXNDUyxJQUFULEVBQVM7Q0FDUCxHQUFRLFNBQUQ7Q0F2Q1QsSUFzQ1M7O0NBdENULEVBMENRLEdBQVIsR0FBUTtDQUNOLFNBQUEsWUFBQTtDQUFBLEVBQVcsQ0FBVixDQUFnQixDQUFqQixDQUFBLEVBQXlCO0NBQXpCLEVBQ1ksQ0FBWCxDQUFXLENBQVo7Q0FDQTtDQUFBLFVBQUEsZ0NBQUE7MkJBQUE7Q0FDRSxHQUFHLENBQUEsQ0FBTSxFQUFUO0NBQ0UsRUFBQSxDQUFDLEVBQWdCLElBQWpCO1VBRko7Q0FBQSxNQUZBO0NBS0EsR0FBQSxTQUFPO0NBaERULElBMENROztDQTFDUixFQW1ETyxFQUFQLElBQU87Q0FDTCxDQUFBLENBQUEsQ0FBQyxFQUFEO0NBQUEsR0FDQyxFQUFEO0NBQ0EsR0FBQSxTQUFPO0NBdERULElBbURPOztDQW5EUCxFQTBEVyxNQUFYO0NBQ0UsRUFBTyxDQUFDLEVBQU0sT0FBUDtDQTNEVCxJQTBEVzs7Q0ExRFg7O0NBWEY7Q0FBQTs7Ozs7QUNBQTs7Ozs7Ozs7O0NBQUE7Q0FBQTtDQUFBO0NBQUEsS0FBQSxDQUFBO0tBQUE7MEpBQUE7O0NBQUEsQ0FTQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsQ0FBUyxDQUFULENBQUEsQ0FBQSxDQUFBLEVBQUEsU0FBQztDQUVaLFNBQUEsRUFBQTtDQUFBLEVBRmtDLENBQUEsRUFBRCxFQUVqQztDQUFBLDRDQUFBO0NBQUEsQ0FBQSxDQUFNLENBQUwsRUFBRCxDQUEwQixPQUFwQjtDQUFOLENBRWlCLENBQVksQ0FBQyxFQUE5QixLQUFpQixlQUFqQjtDQUZBLENBR08sQ0FBUCxDQUFDLEVBQUQ7Q0FIQSxDQUtpQixFQUFoQixDQUFELENBQUEsR0FBQTtDQUxBLEVBTWMsQ0FBYixDQUFhLENBQWQ7Q0FOQSxFQVNBLENBQU8sRUFBUCxFQUFBLENBQ1M7Q0FDTCxFQUFZLENBQUEsQ0FBWCxHQUFEO0NBQUEsSUFDQyxDQUFELEVBQUE7Q0FEQSxFQUdlLENBQUEsQ0FBZCxHQUFELEdBQUEsRUFBZTtDQUNkLENBQUQsR0FBQyxFQUFELEVBQUEsRUFBWSxJQUFaO0NBTkosTUFDUTtDQU9SLEdBQUEsU0FBTztDQW5CVCxJQUFhOztDQUFiLENBdUJrQixDQUFQLENBQUEsQ0FBQSxJQUFYO0NBQ0UsU0FBQSxVQUFBO0NBQUEsRUFBZSxDQUFkLENBQWMsQ0FBZixDQUFBO0FBQ0EsQ0FBQSxVQUFBLGdDQUFBO3lCQUFBO0NBQ0UsQ0FBTyxDQUFBLENBQUssQ0FBQSxFQUFMLENBQVAsT0FBc0I7Q0FDcEIsR0FBQyxDQUFrQixFQUFYLEdBQVI7VUFGSjtDQUFBLE1BREE7Q0FJQSxHQUFBLFNBQU87Q0E1QlQsSUF1Qlc7O0NBdkJYLEVBZ0NTLEdBQVQsR0FBUztDQUNOLEVBQUcsQ0FBSCxJQUFTLEtBQVY7Q0FBb0IsQ0FBQyxFQUFDLEdBQUYsQ0FBRTtDQUF0QixPQUFVO0NBakNaLElBZ0NTOztDQWhDVCxFQXFDVyxHQUFBLEdBQVg7Q0FDRSxNQUFBLEdBQUE7Q0FBQSxHQUFHLENBQUgsQ0FBQSxNQUFxQjtDQUNuQixLQUFNLEVBQU4sTUFBQTtDQUFBLEVBQ1UsR0FBUSxDQUFsQixDQUFBLEtBQVU7Q0FEVixFQUVTLENBQUEsRUFBVCxDQUFnQixDQUFoQixLQUFTO1FBSFg7Q0FLQSxDQUF1QixFQUFuQixDQUFVLENBQWQsU0FBaUM7Q0FDL0IsTUFBTyxDQUFQLEdBQUE7Q0FBQSxDQUN3QyxFQUF2QyxFQUFNLENBQVEsQ0FBZjtNQUZGLEVBQUE7Q0FJRSxNQUFPLENBQVA7Q0FBQSxHQUNDLEVBQU0sRUFBUDtRQVZGO0NBQUEsQ0FZOEIsQ0FBMUIsQ0FBSCxFQUFELENBQUEsUUFBQTtDQUE4QixDQUFDLEVBQUMsRUFBRixFQUFFO0NBWmhDLE9BWUE7Q0FFQSxHQUFBLFNBQU87Q0FwRFQsSUFxQ1c7O0NBckNYOztDQVZGO0NBQUE7Ozs7O0FDQUE7Ozs7Q0FBQTtDQUFBO0NBQUE7Q0FBQSxLQUFBO0tBQUE7OzswSkFBQTs7Q0FBQSxDQUlBLENBQXVCLEdBQWpCLENBQU47Q0FDRTs7Q0FBYSxFQUFBLENBQUEsWUFBQztDQUNaLHNDQUFBO0NBQUEsR0FBQSxFQUFBLGtDQUFNO0NBQU4sRUFFZSxDQUFkLEVBQUQsQ0FBQTtDQUZBLENBSXlDLEVBQTlCLENBQU0sQ0FBakIsS0FBQSxJQUFBO0NBTEYsSUFBYTs7Q0FBYixFQVFVLEVBQUEsR0FBVixDQUFXO0NBQ1QsR0FBUyxDQUFBLEdBQUYsS0FBQTtDQVRULElBUVU7O0NBUlYsRUFZUSxHQUFSLENBQVEsRUFBQztDQUVQLFNBQUEsWUFBQTtDQUFBLEdBQUcsRUFBSCxDQUFXO0NBQ1QsRUFBVyxJQUFRLENBQW5CO01BREYsRUFBQTtDQUVLLEdBQVUsQ0FBQSxTQUFBLHdEQUFBO1FBRmY7QUFLTyxDQUFQLEdBQUEsRUFBQSxDQUFnQixDQUFBO0NBQ2QsRUFBeUIsQ0FBeEIsRUFBd0IsQ0FBaEIsQ0FBVDtRQU5GO0NBQUEsRUFRMkIsQ0FBMUIsQ0FBRCxDQUFBLENBQVMsQ0FBQTtDQVJULEVBUzZCLENBQTVCLEVBQUQsQ0FBUyxDQUFBO0FBRVQsQ0FBQSxFQUFBLFFBQUEsYUFBQTtDQUNFLEVBQVMsQ0FBQyxFQUFWLENBQWtCLENBQWxCO0FBQ0ksQ0FBSixDQUE2QixDQUFBLENBQTFCLENBQTBCLENBQW5CLENBQVEsQ0FBbEIsT0FBd0Q7Q0FDdEQsR0FBQyxNQUFEO01BREYsSUFBQTtDQUdFLEdBQUMsQ0FBRCxLQUFBO0NBQ0EsR0FBQSxhQUFPO1VBTlg7Q0FBQSxNQVhBO0NBa0JBLEdBQUEsU0FBTztDQWhDVCxJQVlROztDQVpSOztDQURvQyxHQUFXLEVBQUw7Q0FKNUM7Ozs7O0FDQUE7Ozs7Q0FBQTtDQUFBO0NBQUE7Q0FBQSxJQUFBLENBQUE7S0FBQSw2RUFBQTs7Q0FBQSxDQUlBLENBQXVCLEdBQWpCLENBQU47Q0FDZSxFQUFBLENBQUEsRUFBQSxTQUFDO0NBQ1osb0NBQUE7Q0FBQSxrQ0FBQTtDQUFBLENBQUEsQ0FBTSxDQUFMLEVBQUQsQ0FBNEIsU0FBdEI7Q0FBTixDQUM0QixDQUFqQixDQUFWLEVBQUQsQ0FBQSxJQUE0QixpQkFBakI7Q0FEWCxFQUVBLENBQUMsRUFBRCxDQUFlLFNBQVI7Q0FGUCxFQUdhLENBQVosRUFBRCxDQUFxQixDQUFSLENBQWI7Q0FIQSxDQUlBLEVBQUMsQ0FBRCxDQUFBLENBQUEsRUFBVTtDQUVWLEdBQUEsU0FBTztDQVBULElBQWE7O0NBQWIsRUFVWSxJQUFBLEVBQUMsQ0FBYjtDQUNFLEVBQUksQ0FBSCxFQUFELENBQUE7Q0FDQSxHQUFBLFNBQU87Q0FaVCxJQVVZOztDQVZaLEVBZU0sQ0FBTixLQUFNO0NBQ0osR0FBQyxFQUFELENBQVEsQ0FBUjtDQUFBLEdBQ0MsRUFBRCxDQUFRO0NBQ1IsR0FBQSxTQUFPO0NBbEJULElBZU07O0NBZk4sRUFxQk8sRUFBUCxJQUFPO0NBQ0wsR0FBQyxFQUFELENBQVE7Q0FBUixHQUNDLEVBQUQsQ0FBUSxJQUFSO0NBRUEsR0FBQSxTQUFPO0NBekJULElBcUJPOztDQXJCUDs7Q0FMRjtDQUFBOzs7OztBQ0FBO0NBQUEsS0FBQSxLQUFBO0tBQUE7b1NBQUE7O0NBQUEsQ0FBQSxDQUFRLEVBQVIsRUFBUSxTQUFBOztDQUVSOzs7O0NBRkE7O0NBQUEsQ0FNQSxDQUF1QixHQUFqQixDQUFOO0NBQ0U7O0NBQWEsQ0FBUyxDQUFULENBQUEsRUFBQSxFQUFBLE1BQUM7Q0FDWixTQUFBLEVBQUE7Q0FBQSxDQUFBLENBQU0sQ0FBTCxFQUFELENBQTJCLFFBQXJCO0NBQU4sQ0FDNEIsQ0FBakIsQ0FBVixFQUFELENBQUEsSUFBNEIsZ0JBQWpCO0NBRFgsRUFFQSxDQUFDLEVBQUQsQ0FBZSxRQUFSO0NBRlAsRUFHYSxDQUFaLEVBQUQsQ0FBcUIsQ0FBUixDQUFiO0NBSEEsQ0FJQSxFQUFDLENBQUQsQ0FBQSxDQUFBLEVBQVU7Q0FKVixFQUtlLENBQWQsQ0FBYyxDQUFmLENBQUE7Q0FMQSxFQU9BLENBQUEsRUFBQSxFQUFBLENBQ1M7Q0FDTCxFQUFZLENBQUEsQ0FBWCxHQUFEO0NBQ0MsRUFBRyxFQUFILENBQUQsQ0FBQSxRQUFBO0NBSEosTUFDUTtDQUdSLEdBQUEsU0FBTztDQVpULElBQWE7O0NBQWIsRUFlVyxHQUFBLEdBQVg7Q0FDRSxTQUFBLEVBQUE7Q0FBQSxHQUFDLEVBQUQsQ0FBUTtDQUFSLEdBQ0MsRUFBRCxDQUFBO0NBRU8sQ0FBK0IsQ0FBbUIsQ0FBOUMsQ0FBTSxDQUFYLEdBQW9ELEVBQTFELEVBQUEsSUFBQTtDQUNFLEdBQUcsRUFBTSxDQUFULENBQUE7Q0FBd0IsSUFBQSxDQUFELElBQUEsT0FBQTtNQUF2QixJQUFBO0NBQWlELElBQUEsQ0FBRCxJQUFBLE9BQUE7VUFETztDQUF6RCxNQUF5RDtDQW5CM0QsSUFlVzs7Q0FmWCxFQXVCWSxHQUFBLEdBQUMsQ0FBYjtDQUNFLEVBQUksQ0FBSCxFQUFELENBQTBCLENBQUEsT0FBaEI7Q0FDVixHQUFBLFNBQU87Q0F6QlQsSUF1Qlk7O0NBdkJaLEVBNEJZLEdBQUEsR0FBQyxDQUFiO0NBQ0UsRUFBSSxDQUFILEVBQUQsQ0FBMEIsQ0FBQSxPQUFoQjtDQUNWLEdBQUEsU0FBTztDQTlCVCxJQTRCWTs7Q0E1QlosRUFpQ1EsR0FBUixDQUFRLEVBQUM7Q0FDUCxHQUFDLEVBQUQsRUFBWSxFQUFaO0NBQXNCLENBQVMsS0FBVCxDQUFBO0NBQXRCLE9BQVk7QUFDTCxDQUFQLEVBQVcsQ0FBWCxFQUFBLFFBQU87Q0FDTCxHQUFVLENBQUEsU0FBQSxnRUFBQTtRQUZaO0NBR0EsR0FBQSxTQUFPO0NBckNULElBaUNROztDQWpDUjs7Q0FEa0M7Q0FOcEMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIkdtYXAgPSByZXF1aXJlKCcuL0dtYXAuY29mZmVlJylcblNlYXJjaCA9IHJlcXVpcmUoJy4vU2VhcmNoLmNvZmZlZScpXG5GaWx0ZXJzID0gcmVxdWlyZSgnLi9GaWx0ZXJzLmNvZmZlZScpXG5Qb3BpbiA9IHJlcXVpcmUoJy4vUG9waW4uY29mZmVlJylcbkxpc3QgPSByZXF1aXJlKCcuL0xpc3QuY29mZmVlJylcbk1hcmtlciA9IHVuZGVmaW5lZFxuXG4jIyNcbiMgTHVuckdtYXBcbiMjIENyZWF0ZSBhIGdvb2dsZSBtYXAgdmlldyBmcm9tIGEgZmVlZCB3aXRoIGx1bnIgc2VhcmNoIGFuZCBjYXRlZ29yeSBuYXZpZ2F0aW9uXG4jIE1hbmFnZSBpbml0aWFsaXphdGlvbiwgbG9hZGluZyBhbmQgZXZlbnRzXG4jIEhhbmRsZSB0aGUgZGlzcGxheSBvZiBjb250ZW50cyBhbmQgcmVzdWx0cyBsaXN0XG4jIyNcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMdW5yR21hcFxuICBjb25zdHJ1Y3RvcjogKEBzZWxlY3RvcikgLT5cbiAgICAjIExvYWRlciBzdG9yZXMgdGhlIGxvYWQgc3RhdGUgb2YgbWFwIGFuZCBmZWVkXG4gICAgQGxvYWRlciA9IG5ldyBMb2FkZXIoKVxuICAgIEBsb2FkZXIuc2V0KFwiZmVlZFwiLCBmYWxzZSlcbiAgICBAbG9hZGVyLnNldChcIm1hcFwiLCBmYWxzZSlcbiAgICBAbG9hZGVyLnNldChcImxpc3RcIiwgZmFsc2UpXG5cbiAgICBAbG9hZGVyLmVtbWl0dGVyLm9uIFwibG9hZC51cGRhdGVcIiwgPT5cbiAgICAgICMgSW5pdCBtYXJrZXIgaWYgdGhlIG1hcCBpcyBsb2FkZWRcbiAgICAgIGlmIEBsb2FkZXIuaXNMb2FkZWQoKVxuICAgICAgICAjIFdlIGNhbiBub3cgYWRkIG1hcmtlcnMgZnJvbSB0aGUgZmVlZCB0byB0aGUgbWFwXG4gICAgICAgIEBhZGRNYXJrZXJzKEBmZWVkKVxuXG4gICAgIyBVbmRlcnNjb3JlIHRlbXBsYXRlc1xuICAgIEB0ZW1wbGF0ZXMgPVxuICAgICAgc2luZ2xlOiBcIlwiXG4gICAgICBsaXN0OiBcIlwiXG5cbiAgICBAY2hlY2tEZXBlbmRlbmNpZXMoKTtcblxuICAgICMgUmV0cmlldmUgb3B0aW9ucyBmcm9tZSBlbGVtZW50IGF0dHJpYnV0ZXNcbiAgICBAJGVsID0gJChAc2VsZWN0b3IpXG4gICAgaWYgQCRlbC5sZW5ndGggPiAxXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzZWxlY3RvciBhcmd1bWVudCBtdXN0IHJlZmVyIHRvIGFuIHVuaXF1ZSBub2RlXCIpXG5cbiAgICAjIFJlbW92ZSBhbHRlcm5hdGl2ZSBjb250ZW50XG4gICAgQCRlbC5lbXB0eSgpXG5cbiAgICBAdGVtcGxhdGVzLnNpbmdsZSA9IEAkZWwuYXR0cignZGF0YS10ZW1wbGF0ZVNpbmdsZScpXG4gICAgQHRlbXBsYXRlcy5saXN0ID0gQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlTGlzdCcpXG4gICAgQGZpZWxkcyA9IEBwYXJzZUZpZWxkcyhAJGVsLmF0dHIoJ2RhdGEtbHVucicpKVxuICAgIEBmaWx0ZXIgPSBAJGVsLmF0dHIoJ2RhdGEtZmlsdGVyJylcblxuICAgIEBpbml0R21hcCgpXG5cbiAgICAjIENyZWF0ZSBhIHBvcGluXG4gICAgQHBvcGluID0gbmV3IFBvcGluKEBzZWxlY3RvcilcblxuICAgICMgQ3JlYXRlIHRoZSBsaXN0IHRvIGRpc3BsYXkgcmVzdWx0c1xuICAgIEBsaXN0ID0gbmV3IExpc3QoQHNlbGVjdG9yLCBAdGVtcGxhdGVzLmxpc3QpXG4gICAgQGxpc3QuJGVsLm9uIFwibG9hZFwiLCA9PlxuICAgICAgQGxvYWRlci5zZXQoXCJsaXN0XCIsIHRydWUpXG5cbiAgICAjIEdldCB0aGUgZmVlZFxuICAgICQuZ2V0KEAkZWwuYXR0cignZGF0YS1mZWVkJykpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQGZlZWQgPSBkYXRhXG4gICAgICAgIEBpbml0RmVlZCgpXG4gICAgICAgIEBpbml0RmlsdGVycygpXG5cbiAgICAjIEdldCB0ZW1wbGF0ZXNcbiAgICAkLmdldChAdGVtcGxhdGVzLnNpbmdsZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGVzLnNpbmdsZSA9IF8udGVtcGxhdGUoZGF0YSlcblxuXG4gICMgIyMgaW5pdEdtYXBcbiAgaW5pdEdtYXA6IC0+XG4gICAgIyBDcmVhdGUgYSBuZXcgR21hcCBvYmplY3RcbiAgICBAbWFwID0gbmV3IEdtYXAoQHNlbGVjdG9yLCBAJGVsLmF0dHIoJ2RhdGEtbGF0aXR1ZGUnKSwgQCRlbC5hdHRyKCdkYXRhLWxvbmdpdHVkZScpLCBwYXJzZUludChAJGVsLmF0dHIoJ2RhdGEtem9vbScpKSlcbiAgICAjIExpc3RlbiB0byBtYXAgbG9hZGluZ1xuICAgIEBtYXAuJGVsLm9uIFwibG9hZFwiLCA9PlxuICAgICAgIyBPbmNlIHRoZSBtYXAgaXMgbG9hZGVkIHdlIGNhbiBnZXQgdGhlIE1hcmtlciBvYmplY3Qgd2hpY2ggZXh0ZW5kIGBnb29nbGUubWFwcy5NYXJrZXJgXG4gICAgICBNYXJrZXIgPSByZXF1aXJlKCcuL01hcmtlci5jb2ZmZWUnKVxuICAgICAgQGxvYWRlci5zZXQoXCJtYXBcIiwgdHJ1ZSlcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgaW5pdEZlZWRcbiAgaW5pdEZlZWQ6ICgpLT5cbiAgICAjIEluaXQgbHVuciBzZWFyY2ggZW5naW5lXG4gICAgQHNlYXJjaCA9IG5ldyBTZWFyY2goQHNlbGVjdG9yLCBAZmVlZCwgQGZpZWxkcylcbiAgICAjIE9uIGx1bnIgYHNlYXJjaC5jaGFuZ2VzYCB3ZSB0cmlnZ2VyIHRoZSBzYW1lIGV2ZW50IG9uIG1hcFxuICAgIEBzZWFyY2guJGVsLm9uIFwic2VhcmNoLmNoYW5nZVwiLCAoZSwgZGF0YSkgPT5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VcIiwgW2RhdGEucmVmcywgXCJpbmRleFwiLCBcImx1bnJcIl1cblxuICAgIEBsb2FkZXIuc2V0KFwiZmVlZFwiLCB0cnVlKVxuXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGluaXRGaWx0ZXJzXG4gIGluaXRGaWx0ZXJzOiAoKS0+XG4gICAgQGZpbHRlcnMgPSBuZXcgRmlsdGVycyhAc2VsZWN0b3IsIEBmZWVkLCBAZmlsdGVyLCBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVGaWx0ZXJzJykpXG4gICAgIyBPbiBmaWx0ZXJzIGBzZWFyY2guY2hhbmdlc2Agd2UgdHJpZ2dlciB0aGUgc2FtZSBldmVudCBvbiBtYXBcbiAgICBAZmlsdGVycy4kZWwub24gXCJzZWFyY2guY2hhbmdlXCIsIChlLCBkYXRhKSA9PlxuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlciBAbWFwLmdtYXAsIFwic2VhcmNoLmNoYW5nZVwiLCBbZGF0YS5maWx0ZXIsIEBmaWx0ZXIsIFwiZmlsdGVyc1wiXVxuXG4gICMgIyMgYWRkTWFya2Vyc1xuICBhZGRNYXJrZXJzOiAoZGF0YSkgLT5cbiAgICBAbWFya2VycyA9IG5ldyBBcnJheSgpXG4gICAgIyBGb3IgZWFjaCBvYmplY3Qgb2YgdGhlIGZlZWQgd2UgYWRkIGEgbWFya2VyXG4gICAgZm9yIG1hcmtlciBpbiBkYXRhXG4gICAgICBAYWRkTWFya2VyKG1hcmtlcilcbiAgICAjIFdlIGNyZWF0ZSB0aGUgcmVzdWx0IGxpc3RcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgYWRkTWFya2VyXG4gIGFkZE1hcmtlcjogKGRhdGEpLT5cbiAgICBkYXRhLnBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhkYXRhLmxhdGl0dWRlLGRhdGEubG9uZ2l0dWRlKVxuICAgIGRhdGEubWFwID0gQG1hcC5nbWFwXG5cbiAgICBtYXJrZXIgPSBuZXcgTWFya2VyKGRhdGEpXG4gICAgQG1hcmtlcnMucHVzaChtYXJrZXIpXG5cbiAgICBAbGlzdC5hZGRNYXJrZXIobWFya2VyKVxuXG4gICAgIyBMaXN0ZW4gdG8gbWFya2VyIGNsaWNrIGV2ZW50IHRvIGRpc3BseSB0aGUgbWFya2VyJ3MgY29udGVudFxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIG1hcmtlciwgJ2NsaWNrJywgKCkgPT5cbiAgICAgIEBkaXNwbGF5U2luZ2xlKG1hcmtlcilcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgZGlzcGxheVNpbmdsZVxuICBkaXNwbGF5U2luZ2xlOiAobWFya2VyKSAtPlxuICAgIEBwb3Bpbi5zZXRDb250ZW50KEB0ZW1wbGF0ZXMuc2luZ2xlKG1hcmtlcikpXG4gICAgcmV0dXJuIEBcblxuXG4gICMgIyMgcGFyc2VGaWVsZHNcbiAgIyBHZXQgZmllbGRzIHRvIHNlYXJjaCBmcm9tIGBkYXRhLWx1bnJgIGF0dHJpYnV0ZVxuICBwYXJzZUZpZWxkczogKGRhdGEpIC0+XG4gICAgZmllbGRzID0gbmV3IEFycmF5KClcbiAgICBmb3IgZmllbGQgaW4gZGF0YS5zcGxpdCgnLCcpXG4gICAgICBmaWVsZCA9IGZpZWxkLnNwbGl0KCd8JylcbiAgICAgIGZpZWxkcy5wdXNoKFtmaWVsZFswXSwgcGFyc2VJbnQoZmllbGRbMV0pXSlcbiAgICByZXR1cm4gZmllbGRzXG5cbiAgIyAjIyBjaGVja0RlcGVuZGVuY2llc1xuICAjIENoZWNrcyBpZiBqUXVlcnkgYW5kIHVuZGVyc2NvcmUgYXJlIGluY2x1ZGVkXG4gIGNoZWNrRGVwZW5kZW5jaWVzOiAtPlxuICAgIGlmICEkPyB0aGVuIHRocm93IG5ldyBFcnJvcignalF1ZXJ5IG5vdCBmb3VuZCcpXG4gICAgaWYgIV8/IHRoZW4gdGhyb3cgbmV3IEVycm9yKCd1bmRlcnNjb3JlIG5vdCBmb3VuZCcpXG5cbiMgRXhwb3J0IHRoZSBjbGFzcyB0byB0aGUgZ2xvYmFsIHNjb3BlXG53aW5kb3cuTHVuckdtYXAgPSBMdW5yR21hcFxuXG5jbGFzcyBMb2FkZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVtbWl0dGVyID0gJCh7fSlcbiAgICBAbW9kdWxlcyA9IG5ldyBPYmplY3QoKVxuXG4gIGlzTG9hZGVkOiA9PlxuICAgIGZvciBtb2R1bGUgb2YgQG1vZHVsZXNcbiAgICAgIHVubGVzcyBAbW9kdWxlc1ttb2R1bGVdXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0cnVlXG5cbiAgc2V0OiAobW9kdWxlLCB2YWx1ZSkgPT5cbiAgICBAbW9kdWxlc1ttb2R1bGVdID0gdmFsdWVcbiAgICBAZW1taXR0ZXIudHJpZ2dlciBcImxvYWQudXBkYXRlXCJcbiIsIiMjI1xuIyBHbWFwXG4jIyBNYW5hZ2UgZ29vZ2xlIG1hcCBpbml0aWFsaXphdGlvbiBhbmQgcmVuZGVyaW5nXG4jIFBhcmFtZXRlcnMgOlxuIyAgIC0gcGFyZW50IDogVGhlIGRvbSBzZWxlY3RvciB3ZXJlIHRoZSBtYXAgbXVzdCBiZSBhZGRlZFxuIyAgIC0gbGF0aXR1ZGUgOiBVc2VkIHRvIGNlbnRlciB0aGUgbWFwXG4jICAgLSBsb25naXR1ZGUgOiBVc2VkIHRvIGNlbnRlciB0aGUgbWFwXG4jICAgLSB6b29tIDogWm9vbSB1c2VkXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgR21hcFxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgQGxhdGl0dWRlLCBAbG9uZ2l0dWRlLCBAem9vbSkgLT5cbiAgICAjIFNldCBhbiB1bmlxdWUgaWRcbiAgICBAaWQgPSAnbWFwLWNhbnZhcy0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICAjIENyZWF0ZSB0aGUgdmlldyBub2RlXG4gICAgJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cIm1hcC1jYW52YXNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcblxuICAgIEB6b29tID0gNCB1bmxlc3MgQHpvb21cbiAgICBAbG9hZEdvb2dsZU1hcHMoKVxuXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGxvYWRHb29nbGVNYXBzXG4gIGxvYWRHb29nbGVNYXBzOiAoKSAtPlxuICAgICMgR2V0IHRoZSBnb29nbGUgbWFwIHNjcmlwdFxuICAgICQuZ2V0U2NyaXB0ICdodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpJywgPT5cbiAgICAgIGdvb2dsZS5sb2FkICdtYXBzJywgJzMnLFxuICAgICAgICBvdGhlcl9wYXJhbXM6ICdzZW5zb3I9ZmFsc2UnXG4gICAgICAgIGNhbGxiYWNrOiBAY3JlYXRlXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGNyZWF0ZVxuICBjcmVhdGU6ICgpID0+XG4gICAgIyBPcHRpb25zXG4gICAgc3R5bGVzID0gW1xuICAgICAgZmVhdHVyZVR5cGU6IFwicG9pXCJcbiAgICAgIGVsZW1lbnRUeXBlOiBcImxhYmVsc1wiXG4gICAgICBzdHlsZXJzOiBbXG4gICAgICAgIHZpc2liaWxpdHk6IFwib2ZmXCJcbiAgICAgIF1cbiAgICBdXG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGdvb2dsZSBtYXBcbiAgICBAZ21hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoQGlkKSxcbiAgICAgIHpvb206IEB6b29tLFxuICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKEBsYXRpdHVkZSxAbG9uZ2l0dWRlKVxuICAgICAgdmlzdWFsUmVmcmVzaDogdHJ1ZVxuICAgICAgZGlzYWJsZURlZmF1bHRVSTogdHJ1ZVxuICAgICAgc3R5bGVzOiBzdHlsZXNcblxuICAgIEAkZWwudHJpZ2dlcihcImxvYWRcIilcbiAgICByZXR1cm4gQFxuIiwiIyMjXG4jIFNlYXJjaFxuIyMgTWFuYWdlIGx1bnIgc2VhcmNoIGVuZ2luZVxuIyBQYXJhbWV0ZXJzIDpcbiMgICAtIHBhcmVudCA6IFRoZSBkb20gc2VsZWN0b3Igd2VyZSB0aGUgc2VhcmNoIGZpZWxkIG11c3QgYmUgYWRkZWRcbiMgICAtIGRhdGEgOiBUaGUgZGF0YSB0byBzZWFyY2hcbiMgICAtIGZpZWxkcyA6IFRoZSBmaWVsZHMgdG8gc2VhcmNoXG4jICAgLSBldmVudCA6IHNlYXJjaCBpbnB1dCBldmVudCB3aGljaCB0cmlnZ2VyIHRoZSBzZWFyY2hcbiMgICAtIHNjb3JlIDogVGhlIG1pbmltdW0gc2NvcmUgcmVxdWlyZWQgdG8gc2hvdyB1cCBpbiByZXN1bHRzXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VhcmNoXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBkYXRhLCBmaWVsZHMsIGV2ZW50LCBzY29yZSkgLT5cbiAgICAjIENyZWF0ZSB0aGUgc2VhcmNoIGZpZWxkXG4gICAgQCRlbCA9ICQoJzxkaXYgY2xhc3M9XCJtYXAtc2VhcmNoXCIgLz4nKVxuICAgICQocGFyZW50KS5hcHBlbmQoQCRlbClcbiAgICBAJGlucHV0ID0gJCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgLz4nKVxuICAgIEAkZWwuYXBwZW5kKEAkaW5wdXQpXG5cbiAgICBAcmVmcyA9IEByZXN1bHRzID0gbmV3IEFycmF5KClcbiAgICBAc2NvcmUgPSAwIHVubGVzcyBzY29yZVxuICAgIGV2ZW50ID0gXCJrZXl1cFwiIHVubGVzcyBldmVudFxuXG4gICAgIyBJbml0aWFsaXplIGx1bnIgZmllbGRzXG4gICAgQGluZGV4ID0gbHVuciAtPlxuICAgICAgZm9yIGZpZWxkIGluIGZpZWxkc1xuICAgICAgICB0aGlzLmZpZWxkKGZpZWxkWzBdLCBmaWVsZFsxXSlcbiAgICAgICAgdGhpcy5yZWYoJ2luZGV4JylcblxuICAgIEAkaW5wdXQub24gZXZlbnQsIEBpbml0U2VhcmNoXG5cbiAgICAjIGFkZCBvYmplY3RzIHRvIGx1bnJcbiAgICBpZiBkYXRhP1xuICAgICAgZm9yIGl0ZW0gaW4gZGF0YVxuICAgICAgICBAaW5kZXguYWRkKGl0ZW0pXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3JlYWR5JylcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgaW5pdFNlYXJjaFxuICBpbml0U2VhcmNoOiAoKSA9PlxuICAgIEBmaWx0ZXIoKVxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAcmVmc30pXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGdldFJlc3VsdHNcbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXR1cm4gQHJlc3VsdHNcblxuICAjICMjIGdldFJlZnNcbiAgZ2V0UmVmczogKCkgLT5cbiAgICByZXR1cm4gQHJlZnNcblxuICAjICMjIGZpbHRlclxuICBmaWx0ZXI6IC0+XG4gICAgQHJlc3VsdHMgPSBAaW5kZXguc2VhcmNoKEBnZXRGaWx0ZXIoKSlcbiAgICBAcmVmcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIHJlc3VsdCBpbiBAcmVzdWx0c1xuICAgICAgaWYgcmVzdWx0LnNjb3JlID49IEBzY29yZVxuICAgICAgICBAcmVmcy5wdXNoKHJlc3VsdC5yZWYpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGNsZWFyXG4gIGNsZWFyOiAtPlxuICAgIEAkaW5wdXQudmFsKFwiXCIpXG4gICAgQGZpbHRlcigpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGdldEZpbHRlclxuICAjIFJldHVybiB0aGUgc2VhcmNoIHN0cmluZ1xuICBnZXRGaWx0ZXI6IC0+XG4gICAgcmV0dXJuIEAkaW5wdXQudmFsKClcbiIsIiMjI1xuIyBGaWx0ZXJzXG4jIyBNYW5hZ2UgZmlsdGVyc1xuIyBQYXJhbWV0ZXJzIDpcbiMgICAtIHBhcmVudCA6IFRoZSBkb20gc2VsZWN0b3Igd2VyZSB0aGUgZmlsdGVyIG5hdmlnYXRpb24gbXVzdCBiZSBhZGRlZFxuIyAgIC0gZGF0YSA6IFRoZSBkYXRhIHRvIHNlYXJjaFxuIyAgIC0gZmllbGRzIDogVGhlIGZpZWxkIHRvIGZpbHRlclxuIyAgIC0gQHRlbXBsYXRlIDogVGhlIHRlbXBsYXRlIHRvIGJ1aWxkIHRoZSBuYXZpZ2F0aW9uXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRmlsdGVyc1xuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGQsIEB0ZW1wbGF0ZSkgLT5cbiAgICAjIFNldCBhbiB1bmlxdWUgaWRcbiAgICBAaWQgPSAnbWFwLWZpbHRlcnMtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgIyBDcmVhdGUgdGhlIHZpZXcgbm9kZVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtZmlsdGVyc1wiIC8+JylcbiAgICBAJGVsID0gJCgnIycrQGlkKVxuXG4gICAgQHBhcnNlRGF0YSBkYXRhLCBmaWVsZFxuICAgIEBmaWx0ZXIgPSBuZXcgQXJyYXkoKVxuXG4gICAgIyBHZXQgdGVtcGxhdGVzXG4gICAgJC5nZXQoQHRlbXBsYXRlKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoZGF0YSlcbiAgICAgICAgQHJlbmRlcigpXG4gICAgICAgICMgZ2V0IGFsbCBuYXZpZ2F0aW9uIGl0ZW1zIChmaWx0ZXJzKSBhbmQgYmluZCBjbGlja3NcbiAgICAgICAgQCRmaWx0ZXJCdG5zID0gQCRlbC5maW5kKCcubWFwLWZpbHRlcicpXG4gICAgICAgIEAkZmlsdGVyQnRucy5vbiBcImNsaWNrXCIsIEBzZXRGaWx0ZXJcblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBwYXJzZURhdGFcbiAgIyBHZXQgYWxsIHVuaXF1ZSBmaWVsZCB2YWx1ZXNcbiAgcGFyc2VEYXRhOiAoZGF0YSwgZmllbGQpIC0+XG4gICAgQGZpbHRlcnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgIHVubGVzcyBpdGVtW2ZpZWxkXSBpbiBAZmlsdGVyc1xuICAgICAgICBAZmlsdGVycy5wdXNoIGl0ZW1bZmllbGRdXG4gICAgcmV0dXJuIEBcblxuICAjICMjIHJlbmRlclxuICAjIENyZWF0ZSB0aGUgbmF2aWdhdGlvbiBmcm9tIGZpbHRlcnNcbiAgcmVuZGVyOiAgLT5cbiAgICBAJGVsLmh0bWwoQHRlbXBsYXRlKHtAZmlsdGVyc30pKVxuXG4gICMgIyMgc2V0RmlsdGVyXG4gICMgIyMgRW5hYmxlL2Rpc2FibGUgYSBmaWx0ZXJcbiAgc2V0RmlsdGVyOiAoZmlsdGVyKSA9PlxuICAgIGlmIGZpbHRlciBpbnN0YW5jZW9mIGpRdWVyeS5FdmVudFxuICAgICAgZmlsdGVyLnByZXZlbnREZWZhdWx0KClcbiAgICAgICRmaWx0ZXIgPSAkKGZpbHRlci50YXJnZXQpLmNsb3Nlc3QoJy5tYXAtZmlsdGVyJylcbiAgICAgIGZpbHRlciA9ICRmaWx0ZXIuYXR0cignZGF0YS1maWx0ZXInKVxuXG4gICAgaWYgKGZpbHRlciA9PSBcImFsbFwiIHx8IGZpbHRlciBpbiBAZmlsdGVyKVxuICAgICAgJGZpbHRlci5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAgICAgQGZpbHRlci5zcGxpY2UoQGZpbHRlci5pbmRleE9mKGZpbHRlciksIDEpXG4gICAgZWxzZVxuICAgICAgJGZpbHRlci5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuICAgICAgQGZpbHRlci5wdXNoKGZpbHRlcilcblxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAZmlsdGVyfSlcblxuICAgIHJldHVybiBAXG4iLCIjIyNcbiMgTWFya2VyXG4jIyBFeHRlbmRzIGdvb2dsZS5tYXBzLk1hcmtlciB0byBlbmFibGUgZmlsdGVyaW5nXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTWFya2VyIGV4dGVuZHMgZ29vZ2xlLm1hcHMuTWFya2VyXG4gIGNvbnN0cnVjdG9yOiAoYXJncykgLT5cbiAgICBzdXBlciBhcmdzXG5cbiAgICBAZW5naW5lcyA9IG5ldyBPYmplY3QoKVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgQGdldE1hcCgpLCAnc2VhcmNoLmNoYW5nZScsIEBmaWx0ZXJcblxuICAjICMjIGdldEZpZWxkXG4gIGdldEZpZWxkOiAoZmllbGQpIC0+XG4gICAgcmV0dXJuIEBbZmllbGRdLnRvU3RyaW5nKClcblxuICAjICMjIGZpbHRlclxuICBmaWx0ZXI6IChyZXN1bHRzKSA9PlxuICAgICMgZ2V0IHRoZSBlbmdpbmUgaW5kZW50aWZpZXJcbiAgICBpZiByZXN1bHRzWzJdXG4gICAgICBlbmdpbmVJZCA9IHJlc3VsdHNbMl1cbiAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIlRoZSBgc2VhcmNoLmNoYW5nZWAgcHVzdCBwYXNzIGFuIHN0cmluZyBpZGVudGlmaWVyIGFzIHRocmlkIGFyZ3VtZW50XCIpXG5cbiAgICAjIFJlZ2lzdGVyIHRoZSBlbmdpbmUgb24gdGhlIGZpcnN0IGZpbHRlclxuICAgIHVubGVzcyBAZW5naW5lc1tlbmdpbmVJZF1cbiAgICAgIEBlbmdpbmVzW2VuZ2luZUlkXSA9IG5ldyBPYmplY3QoKVxuXG4gICAgQGVuZ2luZXNbZW5naW5lSWRdLmZpZWxkID0gcmVzdWx0c1sxXVxuICAgIEBlbmdpbmVzW2VuZ2luZUlkXS5yZXN1bHRzID0gcmVzdWx0c1swXVxuXG4gICAgZm9yIGVuZ2luZUlkIG9mIEBlbmdpbmVzXG4gICAgICBlbmdpbmUgPSBAZW5naW5lc1tlbmdpbmVJZF1cbiAgICAgIGlmICFlbmdpbmUucmVzdWx0cy5sZW5ndGggfHwgQGdldEZpZWxkKGVuZ2luZS5maWVsZCkgaW4gZW5naW5lLnJlc3VsdHNcbiAgICAgICAgQHNldFZpc2libGUodHJ1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldFZpc2libGUoZmFsc2UpXG4gICAgICAgIHJldHVybiBAXG4gICAgcmV0dXJuIEAiLCIjIyNcbiMgUG9waW5cbiMjIENyZWF0ZSBhIHBvcGluXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUG9waW5cbiAgY29uc3RydWN0b3I6IChwYXJlbnQpIC0+XG4gICAgQGlkID0gJ3BvcGluLWNvbnRlbnQtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgQCRwYXJlbnQgPSAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwicG9waW4tY29udGVudFwiIC8+JylcbiAgICBAJGVsID0gQCRwYXJlbnQuZmluZCgnLnBvcGluLWNvbnRlbnQnKVxuICAgIEAkY2xvc2VCdG4gPSBAJHBhcmVudC5maW5kKCcuY2xvc2UnKVxuICAgIEAkY2xvc2VCdG4ub24gXCJjbGlja1wiLCBAY2xvc2VcblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBzZXRDb250ZW50XG4gIHNldENvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIEAkZWwuaHRtbChjb250ZW50KVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBzaG93XG4gIG9wZW46ICgpID0+XG4gICAgQCRwYXJlbnQuYWRkQ2xhc3MoXCJvcGVuXCIpXG4gICAgQCRwYXJlbnQudHJpZ2dlcihcIm9wZW5cIilcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgY2xvc2VcbiAgY2xvc2U6ICgpID0+XG4gICAgQCRwYXJlbnQudHJpZ2dlcihcImNsb3NlXCIpXG4gICAgQCRwYXJlbnQucmVtb3ZlQ2xhc3MoXCJvcGVuXCIpXG5cbiAgICByZXR1cm4gQFxuIiwiUG9waW4gPSByZXF1aXJlKCcuL1BvcGluLmNvZmZlZScpXG5cbiMjI1xuIyBMaXN0XG4jIyBMaXN0IE1hcmtlclxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExpc3QgZXh0ZW5kcyBQb3BpblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgdGVtcGxhdGUpIC0+XG4gICAgQGlkID0gJ2xpc3QtY29udGVudC0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICBAJHBhcmVudCA9ICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJsaXN0LWNvbnRlbnRcIiAvPicpXG4gICAgQCRlbCA9IEAkcGFyZW50LmZpbmQoJy5saXN0LWNvbnRlbnQnKVxuICAgIEAkY2xvc2VCdG4gPSBAJHBhcmVudC5maW5kKCcuY2xvc2UnKVxuICAgIEAkY2xvc2VCdG4ub24gXCJjbGlja1wiLCBAY2xvc2VcbiAgICBAbWFya2VycyA9IG5ldyBBcnJheSgpXG5cbiAgICAkLmdldCh0ZW1wbGF0ZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGUgPSBfLnRlbXBsYXRlKGRhdGEpXG4gICAgICAgIEAkZWwudHJpZ2dlciBcImxvYWRcIlxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBhZGRNYXJrZXJcbiAgYWRkTWFya2VyOiAobWFya2VyKSAtPlxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuICAgIEByZW5kZXIoQG1hcmtlcnMpXG5cbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBtYXJrZXIsICd2aXNpYmxlX2NoYW5nZWQnLCAoZSkgPT5cbiAgICAgIGlmIG1hcmtlci52aXNpYmxlIHRoZW4gQHNob3dNYXJrZXIobWFya2VyKSBlbHNlIEBoaWRlTWFya2VyKG1hcmtlcilcblxuICAjICMjIHNob3dNYXJrZXJcbiAgc2hvd01hcmtlcjogKG1hcmtlcikgLT5cbiAgICBAJGVsLmZpbmQoJ1tkYXRhLWluZGV4PVwiJyttYXJrZXIuZ2V0RmllbGQoXCJpbmRleFwiKSsnXCJdJykuc2hvdygpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIHJlbmRlclxuICBoaWRlTWFya2VyOiAobWFya2VyKSAtPlxuICAgIEAkZWwuZmluZCgnW2RhdGEtaW5kZXg9XCInK21hcmtlci5nZXRGaWVsZChcImluZGV4XCIpKydcIl0nKS5oaWRlKClcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgcmVuZGVyXG4gIHJlbmRlcjogKG1hcmtlcnMpIC0+XG4gICAgQHNldENvbnRlbnQoQHRlbXBsYXRlKG1hcmtlcnM6IG1hcmtlcnMpKVxuICAgIHVubGVzcyBAJGVsLmZpbmQoJ1tkYXRhLWluZGV4XScpLmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgYXR0cmlidXRlIGBkYXRhLWluZGV4PVwiPCU9bWFya2VyLmluZGV4JT5gIGlzIHJlcXVpcmVkIGluIHRlbXBsYXRlIGZpbGVcIiAnKVxuICAgIHJldHVybiBAXG4iXX0=
;