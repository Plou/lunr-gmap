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
      this.popin.open();
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
      this.id = 'popin-' + (new Date().getTime());
      this.$wrapper = $('<div id="' + this.id + '" class="popin-wrap close" />');
      this.$closeBtn = $('<button class="popin-close">close</button>');
      this.$el = $('<div class="popin-content" />');
      this.$wrapper.append(this.$closeBtn);
      this.$wrapper.append(this.$el);
      this.$parent = $(parent).append(this.$wrapper);
      this.$closeBtn.on("click", this.close);
      this.$parent.on("list.open", this.close);
      this.$parent.on("list.close", this.open);
      return this;
    }

    Popin.prototype.setContent = function(content) {
      this.$el.html(content);
      return this;
    };

    Popin.prototype.open = function() {
      this.$wrapper.addClass("open");
      this.$wrapper.removeClass("close");
      this.$wrapper.trigger("popin.open");
      return this;
    };

    Popin.prototype.close = function() {
      this.$wrapper.addClass("close");
      this.$wrapper.removeClass("open");
      this.$wrapper.trigger("popin.close");
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
      this.$parent = $(parent).append('<div id="' + this.id + '" class="list-content close" />');
      this.$el = this.$parent.find('.list-content');
      this.markers = new Array();
      $.get(template).done(function(data) {
        _this.template = _.template(data);
        return _this.$el.trigger("load");
      });
      this.$parent.on("search.change", function(e) {
        if (e.target.className === "map-search") {
          return _this.open();
        }
      });
      this.$parent.on("popin.open", this.close);
      this.$parent.on("popin.close", this.open);
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
      if (!this.$el.hasClass("open")) {
        this.$el.addClass("open");
        this.$el.removeClass("close");
        this.$el.trigger("list.open");
      }
      return this;
    };

    List.prototype.close = function() {
      if (!this.$el.hasClass("close")) {
        this.$el.addClass("close");
        this.$el.removeClass("open");
        return this.$el.trigger("list.close");
      }
    };

    List.prototype.render = function(markers) {
      var _this = this;
      this.setContent(this.template({
        markers: markers
      }));
      this.$closeBtn = this.$parent.find('.list-close');
      this.$closeBtn.on("click", this.close);
      if (!this.$el.find('[data-index]').length) {
        throw new Error('The attribute `data-index="<%=marker.index%>` is required in template file" ');
      }
      this.$el.find('[data-index]').on("click", function(e) {
        var index;
        _this.close();
        index = $(e.target).closest('[data-index]').attr("data-index");
        return google.maps.event.trigger(markers[index], 'click');
      });
      return this;
    };

    return List;

  })(Popin);

}).call(this);


},{"./Popin.coffee":5}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1BvcGluLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9MaXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLHNEQUFBO0tBQUEsNkVBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxRQUFBOztDQUFQLENBQ0EsQ0FBUyxHQUFULENBQVMsVUFBQTs7Q0FEVCxDQUVBLENBQVUsSUFBVixXQUFVOztDQUZWLENBR0EsQ0FBUSxFQUFSLEVBQVEsU0FBQTs7Q0FIUixDQUlBLENBQU8sQ0FBUCxHQUFPLFFBQUE7O0NBSlAsQ0FLQSxDQUFTLEdBQVQ7O0NBRUE7Ozs7OztDQVBBOztDQUFBLENBY0EsQ0FBdUIsR0FBakIsQ0FBTjtDQUNlLEVBQUEsQ0FBQSxJQUFBLFVBQUU7Q0FFYixTQUFBLEVBQUE7Q0FBQSxFQUZhLENBQUEsRUFBRCxFQUVaO0NBQUEsRUFBYyxDQUFiLEVBQUQ7Q0FBQSxDQUNvQixDQUFwQixDQUFDLENBQUQsQ0FBQTtDQURBLENBRW1CLENBQW5CLENBQUMsQ0FBRCxDQUFBO0NBRkEsQ0FHb0IsQ0FBcEIsQ0FBQyxDQUFELENBQUE7Q0FIQSxDQUtBLENBQW1DLENBQWxDLEVBQUQsRUFBZ0IsQ0FBbUIsSUFBbkM7Q0FFRSxHQUFHLENBQUMs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VyxDQUFYLEVBQUEsRUFBTztDQUNMLEVBQUksQ0FBSCxFQUFELEVBQUE7Q0FBQSxFQUNJLENBQUgsR0FBRCxDQUFBLEdBQUE7Q0FEQSxFQUVJLENBQUgsR0FBRCxDQUFBLEdBQUE7UUFIRjtDQUlBLEdBQUEsU0FBTztDQTlDVCxJQXlDTTs7Q0F6Q04sRUFpRE8sRUFBUCxJQUFPO0FBQ0UsQ0FBUCxFQUFXLENBQVgsRUFBQSxDQUFPLENBQUE7Q0FDTCxFQUFJLENBQUgsR0FBRCxDQUFBO0NBQUEsRUFDSSxDQUFILEVBQUQsRUFBQSxHQUFBO0NBQ0MsRUFBRyxDQUFILEdBQUQsS0FBQSxHQUFBO1FBSkc7Q0FqRFAsSUFpRE87O0NBakRQLEVBd0RRLEdBQVIsQ0FBUSxFQUFDO0NBQ1AsU0FBQSxFQUFBO0NBQUEsR0FBQyxFQUFELEVBQVksRUFBWjtDQUFzQixDQUFTLEtBQVQsQ0FBQTtDQUF0QixPQUFZO0NBQVosRUFDYSxDQUFaLEVBQUQsQ0FBcUIsRUFBckIsSUFBYTtDQURiLENBRUEsRUFBQyxDQUFELENBQUEsQ0FBQSxFQUFVO0FBRUgsQ0FBUCxFQUFXLENBQVgsRUFBQSxRQUFPO0NBQ0wsR0FBVSxDQUFBLFNBQUEsZ0VBQUE7UUFMWjtDQUFBLENBT0EsQ0FBSSxDQUFILEVBQUQsQ0FBQSxFQUF1QyxLQUF2QztDQUNFLElBQUEsT0FBQTtDQUFBLElBQUMsR0FBRDtDQUFBLEVBQ1EsQ0FBQSxDQUFSLENBQVEsQ0FBQSxDQUFSLElBQVEsRUFBQTtDQUNELENBQW1DLEVBQS9CLENBQU0sQ0FBWCxDQUFOLFFBQUE7Q0FIRixNQUFzQztDQUt0QyxHQUFBLFNBQU87Q0FyRVQsSUF3RFE7O0NBeERSOztDQURrQztDQU5wQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiR21hcCA9IHJlcXVpcmUoJy4vR21hcC5jb2ZmZWUnKVxuU2VhcmNoID0gcmVxdWlyZSgnLi9TZWFyY2guY29mZmVlJylcbkZpbHRlcnMgPSByZXF1aXJlKCcuL0ZpbHRlcnMuY29mZmVlJylcblBvcGluID0gcmVxdWlyZSgnLi9Qb3Bpbi5jb2ZmZWUnKVxuTGlzdCA9IHJlcXVpcmUoJy4vTGlzdC5jb2ZmZWUnKVxuTWFya2VyID0gdW5kZWZpbmVkXG5cbiMjI1xuIyBMdW5yR21hcFxuIyMgQ3JlYXRlIGEgZ29vZ2xlIG1hcCB2aWV3IGZyb20gYSBmZWVkIHdpdGggbHVuciBzZWFyY2ggYW5kIGNhdGVnb3J5IG5hdmlnYXRpb25cbiMgTWFuYWdlIGluaXRpYWxpemF0aW9uLCBsb2FkaW5nIGFuZCBldmVudHNcbiMgSGFuZGxlIHRoZSBkaXNwbGF5IG9mIGNvbnRlbnRzIGFuZCByZXN1bHRzIGxpc3RcbiMjI1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEx1bnJHbWFwXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdG9yKSAtPlxuICAgICMgTG9hZGVyIHN0b3JlcyB0aGUgbG9hZCBzdGF0ZSBvZiBtYXAgYW5kIGZlZWRcbiAgICBAbG9hZGVyID0gbmV3IExvYWRlcigpXG4gICAgQGxvYWRlci5zZXQoXCJmZWVkXCIsIGZhbHNlKVxuICAgIEBsb2FkZXIuc2V0KFwibWFwXCIsIGZhbHNlKVxuICAgIEBsb2FkZXIuc2V0KFwibGlzdFwiLCBmYWxzZSlcblxuICAgIEBsb2FkZXIuZW1taXR0ZXIub24gXCJsb2FkLnVwZGF0ZVwiLCA9PlxuICAgICAgIyBJbml0IG1hcmtlciBpZiB0aGUgbWFwIGlzIGxvYWRlZFxuICAgICAgaWYgQGxvYWRlci5pc0xvYWRlZCgpXG4gICAgICAgICMgV2UgY2FuIG5vdyBhZGQgbWFya2VycyBmcm9tIHRoZSBmZWVkIHRvIHRoZSBtYXBcbiAgICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG5cbiAgICAjIFVuZGVyc2NvcmUgdGVtcGxhdGVzXG4gICAgQHRlbXBsYXRlcyA9XG4gICAgICBzaW5nbGU6IFwiXCJcbiAgICAgIGxpc3Q6IFwiXCJcblxuICAgIEBjaGVja0RlcGVuZGVuY2llcygpO1xuXG4gICAgIyBSZXRyaWV2ZSBvcHRpb25zIGZyb21lIGVsZW1lbnQgYXR0cmlidXRlc1xuICAgIEAkZWwgPSAkKEBzZWxlY3RvcilcbiAgICBpZiBAJGVsLmxlbmd0aCA+IDFcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGFyZ3VtZW50IG11c3QgcmVmZXIgdG8gYW4gdW5pcXVlIG5vZGVcIilcblxuICAgICMgUmVtb3ZlIGFsdGVybmF0aXZlIGNvbnRlbnRcbiAgICBAJGVsLmVtcHR5KClcblxuICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlU2luZ2xlJylcbiAgICBAdGVtcGxhdGVzLmxpc3QgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVMaXN0JylcbiAgICBAZmllbGRzID0gQHBhcnNlRmllbGRzKEAkZWwuYXR0cignZGF0YS1sdW5yJykpXG4gICAgQGZpbHRlciA9IEAkZWwuYXR0cignZGF0YS1maWx0ZXInKVxuXG4gICAgQGluaXRHbWFwKClcblxuICAgICMgQ3JlYXRlIGEgcG9waW5cbiAgICBAcG9waW4gPSBuZXcgUG9waW4oQHNlbGVjdG9yKVxuXG4gICAgIyBDcmVhdGUgdGhlIGxpc3QgdG8gZGlzcGxheSByZXN1bHRzXG4gICAgQGxpc3QgPSBuZXcgTGlzdChAc2VsZWN0b3IsIEB0ZW1wbGF0ZXMubGlzdClcbiAgICBAbGlzdC4kZWwub24gXCJsb2FkXCIsID0+XG4gICAgICBAbG9hZGVyLnNldChcImxpc3RcIiwgdHJ1ZSlcblxuICAgICMgR2V0IHRoZSBmZWVkXG4gICAgJC5nZXQoQCRlbC5hdHRyKCdkYXRhLWZlZWQnKSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAZmVlZCA9IGRhdGFcbiAgICAgICAgQGluaXRGZWVkKClcbiAgICAgICAgQGluaXRGaWx0ZXJzKClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZXMuc2luZ2xlKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gXy50ZW1wbGF0ZShkYXRhKVxuXG5cbiAgIyAjIyBpbml0R21hcFxuICBpbml0R21hcDogLT5cbiAgICAjIENyZWF0ZSBhIG5ldyBHbWFwIG9iamVjdFxuICAgIEBtYXAgPSBuZXcgR21hcChAc2VsZWN0b3IsIEAkZWwuYXR0cignZGF0YS1sYXRpdHVkZScpLCBAJGVsLmF0dHIoJ2RhdGEtbG9uZ2l0dWRlJyksIHBhcnNlSW50KEAkZWwuYXR0cignZGF0YS16b29tJykpKVxuICAgICMgTGlzdGVuIHRvIG1hcCBsb2FkaW5nXG4gICAgQG1hcC4kZWwub24gXCJsb2FkXCIsID0+XG4gICAgICAjIE9uY2UgdGhlIG1hcCBpcyBsb2FkZWQgd2UgY2FuIGdldCB0aGUgTWFya2VyIG9iamVjdCB3aGljaCBleHRlbmQgYGdvb2dsZS5tYXBzLk1hcmtlcmBcbiAgICAgIE1hcmtlciA9IHJlcXVpcmUoJy4vTWFya2VyLmNvZmZlZScpXG4gICAgICBAbG9hZGVyLnNldChcIm1hcFwiLCB0cnVlKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBpbml0RmVlZFxuICBpbml0RmVlZDogKCktPlxuICAgICMgSW5pdCBsdW5yIHNlYXJjaCBlbmdpbmVcbiAgICBAc2VhcmNoID0gbmV3IFNlYXJjaChAc2VsZWN0b3IsIEBmZWVkLCBAZmllbGRzKVxuICAgICMgT24gbHVuciBgc2VhcmNoLmNoYW5nZXNgIHdlIHRyaWdnZXIgdGhlIHNhbWUgZXZlbnQgb24gbWFwXG4gICAgQHNlYXJjaC4kZWwub24gXCJzZWFyY2guY2hhbmdlXCIsIChlLCBkYXRhKSA9PlxuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlciBAbWFwLmdtYXAsIFwic2VhcmNoLmNoYW5nZVwiLCBbZGF0YS5yZWZzLCBcImluZGV4XCIsIFwibHVuclwiXVxuICAgIEBsb2FkZXIuc2V0KFwiZmVlZFwiLCB0cnVlKVxuXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGluaXRGaWx0ZXJzXG4gIGluaXRGaWx0ZXJzOiAoKS0+XG4gICAgQGZpbHRlcnMgPSBuZXcgRmlsdGVycyhAc2VsZWN0b3IsIEBmZWVkLCBAZmlsdGVyLCBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVGaWx0ZXJzJykpXG4gICAgIyBPbiBmaWx0ZXJzIGBzZWFyY2guY2hhbmdlc2Agd2UgdHJpZ2dlciB0aGUgc2FtZSBldmVudCBvbiBtYXBcbiAgICBAZmlsdGVycy4kZWwub24gXCJzZWFyY2guY2hhbmdlXCIsIChlLCBkYXRhKSA9PlxuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlciBAbWFwLmdtYXAsIFwic2VhcmNoLmNoYW5nZVwiLCBbZGF0YS5maWx0ZXIsIEBmaWx0ZXIsIFwiZmlsdGVyc1wiXVxuXG4gICMgIyMgYWRkTWFya2Vyc1xuICBhZGRNYXJrZXJzOiAoZGF0YSkgLT5cbiAgICBAbWFya2VycyA9IG5ldyBBcnJheSgpXG4gICAgIyBGb3IgZWFjaCBvYmplY3Qgb2YgdGhlIGZlZWQgd2UgYWRkIGEgbWFya2VyXG4gICAgZm9yIG1hcmtlciBpbiBkYXRhXG4gICAgICBAYWRkTWFya2VyKG1hcmtlcilcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgYWRkTWFya2VyXG4gIGFkZE1hcmtlcjogKGRhdGEpLT5cbiAgICBkYXRhLnBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhkYXRhLmxhdGl0dWRlLGRhdGEubG9uZ2l0dWRlKVxuICAgIGRhdGEubWFwID0gQG1hcC5nbWFwXG5cbiAgICBtYXJrZXIgPSBuZXcgTWFya2VyKGRhdGEpXG4gICAgQG1hcmtlcnMucHVzaChtYXJrZXIpXG5cbiAgICBAbGlzdC5hZGRNYXJrZXIobWFya2VyKVxuXG4gICAgIyBMaXN0ZW4gdG8gbWFya2VyIGNsaWNrIGV2ZW50IHRvIGRpc3BseSB0aGUgbWFya2VyJ3MgY29udGVudFxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIG1hcmtlciwgJ2NsaWNrJywgKCkgPT5cbiAgICAgIEBkaXNwbGF5U2luZ2xlKG1hcmtlcilcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgZGlzcGxheVNpbmdsZVxuICBkaXNwbGF5U2luZ2xlOiAobWFya2VyKSAtPlxuICAgIEBwb3Bpbi5zZXRDb250ZW50KEB0ZW1wbGF0ZXMuc2luZ2xlKG1hcmtlcikpXG4gICAgQHBvcGluLm9wZW4oKVxuICAgIHJldHVybiBAXG5cblxuICAjICMjIHBhcnNlRmllbGRzXG4gICMgR2V0IGZpZWxkcyB0byBzZWFyY2ggZnJvbSBgZGF0YS1sdW5yYCBhdHRyaWJ1dGVcbiAgcGFyc2VGaWVsZHM6IChkYXRhKSAtPlxuICAgIGZpZWxkcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIGZpZWxkIGluIGRhdGEuc3BsaXQoJywnKVxuICAgICAgZmllbGQgPSBmaWVsZC5zcGxpdCgnfCcpXG4gICAgICBmaWVsZHMucHVzaChbZmllbGRbMF0sIHBhcnNlSW50KGZpZWxkWzFdKV0pXG4gICAgcmV0dXJuIGZpZWxkc1xuXG4gICMgIyMgY2hlY2tEZXBlbmRlbmNpZXNcbiAgIyBDaGVja3MgaWYgalF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBpbmNsdWRlZFxuICBjaGVja0RlcGVuZGVuY2llczogLT5cbiAgICBpZiAhJD8gdGhlbiB0aHJvdyBuZXcgRXJyb3IoJ2pRdWVyeSBub3QgZm91bmQnKVxuICAgIGlmICFfPyB0aGVuIHRocm93IG5ldyBFcnJvcigndW5kZXJzY29yZSBub3QgZm91bmQnKVxuXG4jIEV4cG9ydCB0aGUgY2xhc3MgdG8gdGhlIGdsb2JhbCBzY29wZVxud2luZG93Lkx1bnJHbWFwID0gTHVuckdtYXBcblxuY2xhc3MgTG9hZGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlbW1pdHRlciA9ICQoe30pXG4gICAgQG1vZHVsZXMgPSBuZXcgT2JqZWN0KClcblxuICBpc0xvYWRlZDogPT5cbiAgICBmb3IgbW9kdWxlIG9mIEBtb2R1bGVzXG4gICAgICB1bmxlc3MgQG1vZHVsZXNbbW9kdWxlXVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHNldDogKG1vZHVsZSwgdmFsdWUpID0+XG4gICAgQG1vZHVsZXNbbW9kdWxlXSA9IHZhbHVlXG4gICAgQGVtbWl0dGVyLnRyaWdnZXIgXCJsb2FkLnVwZGF0ZVwiXG4iLCIjIyNcbiMgR21hcFxuIyMgTWFuYWdlIGdvb2dsZSBtYXAgaW5pdGlhbGl6YXRpb24gYW5kIHJlbmRlcmluZ1xuIyBQYXJhbWV0ZXJzIDpcbiMgICAtIHBhcmVudCA6IFRoZSBkb20gc2VsZWN0b3Igd2VyZSB0aGUgbWFwIG11c3QgYmUgYWRkZWRcbiMgICAtIGxhdGl0dWRlIDogVXNlZCB0byBjZW50ZXIgdGhlIG1hcFxuIyAgIC0gbG9uZ2l0dWRlIDogVXNlZCB0byBjZW50ZXIgdGhlIG1hcFxuIyAgIC0gem9vbSA6IFpvb20gdXNlZFxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEdtYXBcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIEBsYXRpdHVkZSwgQGxvbmdpdHVkZSwgQHpvb20pIC0+XG4gICAgIyBTZXQgYW4gdW5pcXVlIGlkXG4gICAgQGlkID0gJ21hcC1jYW52YXMtJysobmV3IERhdGUoKS5nZXRUaW1lKCkpXG4gICAgIyBDcmVhdGUgdGhlIHZpZXcgbm9kZVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtY2FudmFzXCIgLz4nKVxuICAgIEAkZWwgPSAkKCcjJytAaWQpXG5cbiAgICBAem9vbSA9IDQgdW5sZXNzIEB6b29tXG4gICAgQGxvYWRHb29nbGVNYXBzKClcblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBsb2FkR29vZ2xlTWFwc1xuICBsb2FkR29vZ2xlTWFwczogKCkgLT5cbiAgICAjIEdldCB0aGUgZ29vZ2xlIG1hcCBzY3JpcHRcbiAgICAkLmdldFNjcmlwdCAnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaScsID0+XG4gICAgICBnb29nbGUubG9hZCAnbWFwcycsICczJyxcbiAgICAgICAgb3RoZXJfcGFyYW1zOiAnc2Vuc29yPWZhbHNlJ1xuICAgICAgICBjYWxsYmFjazogQGNyZWF0ZVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjcmVhdGVcbiAgY3JlYXRlOiAoKSA9PlxuICAgICMgT3B0aW9uc1xuICAgIHN0eWxlcyA9IFtcbiAgICAgIGZlYXR1cmVUeXBlOiBcInBvaVwiXG4gICAgICBlbGVtZW50VHlwZTogXCJsYWJlbHNcIlxuICAgICAgc3R5bGVyczogW1xuICAgICAgICB2aXNpYmlsaXR5OiBcIm9mZlwiXG4gICAgICBdXG4gICAgXVxuXG4gICAgIyBJbml0aWFsaXplIHRoZSBnb29nbGUgbWFwXG4gICAgQGdtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKEBpZCksXG4gICAgICB6b29tOiBAem9vbSxcbiAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhAbGF0aXR1ZGUsQGxvbmdpdHVkZSlcbiAgICAgIHZpc3VhbFJlZnJlc2g6IHRydWVcbiAgICAgIGRpc2FibGVEZWZhdWx0VUk6IHRydWVcbiAgICAgIHN0eWxlczogc3R5bGVzXG5cbiAgICBAJGVsLnRyaWdnZXIoXCJsb2FkXCIpXG4gICAgcmV0dXJuIEBcbiIsIiMjI1xuIyBTZWFyY2hcbiMjIE1hbmFnZSBsdW5yIHNlYXJjaCBlbmdpbmVcbiMgUGFyYW1ldGVycyA6XG4jICAgLSBwYXJlbnQgOiBUaGUgZG9tIHNlbGVjdG9yIHdlcmUgdGhlIHNlYXJjaCBmaWVsZCBtdXN0IGJlIGFkZGVkXG4jICAgLSBkYXRhIDogVGhlIGRhdGEgdG8gc2VhcmNoXG4jICAgLSBmaWVsZHMgOiBUaGUgZmllbGRzIHRvIHNlYXJjaFxuIyAgIC0gZXZlbnQgOiBzZWFyY2ggaW5wdXQgZXZlbnQgd2hpY2ggdHJpZ2dlciB0aGUgc2VhcmNoXG4jICAgLSBzY29yZSA6IFRoZSBtaW5pbXVtIHNjb3JlIHJlcXVpcmVkIHRvIHNob3cgdXAgaW4gcmVzdWx0c1xuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlYXJjaFxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGRzLCBldmVudCwgc2NvcmUpIC0+XG4gICAgIyBDcmVhdGUgdGhlIHNlYXJjaCBmaWVsZFxuICAgIEAkZWwgPSAkKCc8ZGl2IGNsYXNzPVwibWFwLXNlYXJjaFwiIC8+JylcbiAgICAkKHBhcmVudCkuYXBwZW5kKEAkZWwpXG4gICAgQCRpbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIC8+JylcbiAgICBAJGVsLmFwcGVuZChAJGlucHV0KVxuXG4gICAgQHJlZnMgPSBAcmVzdWx0cyA9IG5ldyBBcnJheSgpXG4gICAgQHNjb3JlID0gMCB1bmxlc3Mgc2NvcmVcbiAgICBldmVudCA9IFwia2V5dXBcIiB1bmxlc3MgZXZlbnRcblxuICAgICMgSW5pdGlhbGl6ZSBsdW5yIGZpZWxkc1xuICAgIEBpbmRleCA9IGx1bnIgLT5cbiAgICAgIGZvciBmaWVsZCBpbiBmaWVsZHNcbiAgICAgICAgdGhpcy5maWVsZChmaWVsZFswXSwgZmllbGRbMV0pXG4gICAgICAgIHRoaXMucmVmKCdpbmRleCcpXG5cbiAgICBAJGlucHV0Lm9uIGV2ZW50LCBAaW5pdFNlYXJjaFxuXG4gICAgIyBhZGQgb2JqZWN0cyB0byBsdW5yXG4gICAgaWYgZGF0YT9cbiAgICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgICAgQGluZGV4LmFkZChpdGVtKVxuXG4gICAgQCRlbC50cmlnZ2VyKCdyZWFkeScpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGluaXRTZWFyY2hcbiAgaW5pdFNlYXJjaDogKCkgPT5cbiAgICBAZmlsdGVyKClcbiAgICBAJGVsLnRyaWdnZXIoJ3NlYXJjaC5jaGFuZ2UnLCB7QHJlZnN9KVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBnZXRSZXN1bHRzXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmV0dXJuIEByZXN1bHRzXG5cbiAgIyAjIyBnZXRSZWZzXG4gIGdldFJlZnM6ICgpIC0+XG4gICAgcmV0dXJuIEByZWZzXG5cbiAgIyAjIyBmaWx0ZXJcbiAgZmlsdGVyOiAtPlxuICAgIEByZXN1bHRzID0gQGluZGV4LnNlYXJjaChAZ2V0RmlsdGVyKCkpXG4gICAgQHJlZnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciByZXN1bHQgaW4gQHJlc3VsdHNcbiAgICAgIGlmIHJlc3VsdC5zY29yZSA+PSBAc2NvcmVcbiAgICAgICAgQHJlZnMucHVzaChyZXN1bHQucmVmKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjbGVhclxuICBjbGVhcjogLT5cbiAgICBAJGlucHV0LnZhbChcIlwiKVxuICAgIEBmaWx0ZXIoKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBnZXRGaWx0ZXJcbiAgIyBSZXR1cm4gdGhlIHNlYXJjaCBzdHJpbmdcbiAgZ2V0RmlsdGVyOiAtPlxuICAgIHJldHVybiBAJGlucHV0LnZhbCgpXG4iLCIjIyNcbiMgRmlsdGVyc1xuIyMgTWFuYWdlIGZpbHRlcnNcbiMgUGFyYW1ldGVycyA6XG4jICAgLSBwYXJlbnQgOiBUaGUgZG9tIHNlbGVjdG9yIHdlcmUgdGhlIGZpbHRlciBuYXZpZ2F0aW9uIG11c3QgYmUgYWRkZWRcbiMgICAtIGRhdGEgOiBUaGUgZGF0YSB0byBzZWFyY2hcbiMgICAtIGZpZWxkcyA6IFRoZSBmaWVsZCB0byBmaWx0ZXJcbiMgICAtIEB0ZW1wbGF0ZSA6IFRoZSB0ZW1wbGF0ZSB0byBidWlsZCB0aGUgbmF2aWdhdGlvblxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZpbHRlcnNcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIGRhdGEsIGZpZWxkLCBAdGVtcGxhdGUpIC0+XG4gICAgIyBTZXQgYW4gdW5pcXVlIGlkXG4gICAgQGlkID0gJ21hcC1maWx0ZXJzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICMgQ3JlYXRlIHRoZSB2aWV3IG5vZGVcbiAgICAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwibWFwLWZpbHRlcnNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcblxuICAgIEBwYXJzZURhdGEgZGF0YSwgZmllbGRcbiAgICBAZmlsdGVyID0gbmV3IEFycmF5KClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGUgPSBfLnRlbXBsYXRlKGRhdGEpXG4gICAgICAgIEByZW5kZXIoKVxuICAgICAgICAjIGdldCBhbGwgbmF2aWdhdGlvbiBpdGVtcyAoZmlsdGVycykgYW5kIGJpbmQgY2xpY2tzXG4gICAgICAgIEAkZmlsdGVyQnRucyA9IEAkZWwuZmluZCgnLm1hcC1maWx0ZXInKVxuICAgICAgICBAJGZpbHRlckJ0bnMub24gXCJjbGlja1wiLCBAc2V0RmlsdGVyXG5cbiAgICByZXR1cm4gQFxuXG4gICMgIyMgcGFyc2VEYXRhXG4gICMgR2V0IGFsbCB1bmlxdWUgZmllbGQgdmFsdWVzXG4gIHBhcnNlRGF0YTogKGRhdGEsIGZpZWxkKSAtPlxuICAgIEBmaWx0ZXJzID0gbmV3IEFycmF5KClcbiAgICBmb3IgaXRlbSBpbiBkYXRhXG4gICAgICB1bmxlc3MgaXRlbVtmaWVsZF0gaW4gQGZpbHRlcnNcbiAgICAgICAgQGZpbHRlcnMucHVzaCBpdGVtW2ZpZWxkXVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyByZW5kZXJcbiAgIyBDcmVhdGUgdGhlIG5hdmlnYXRpb24gZnJvbSBmaWx0ZXJzXG4gIHJlbmRlcjogIC0+XG4gICAgQCRlbC5odG1sKEB0ZW1wbGF0ZSh7QGZpbHRlcnN9KSlcblxuICAjICMjIHNldEZpbHRlclxuICAjICMjIEVuYWJsZS9kaXNhYmxlIGEgZmlsdGVyXG4gIHNldEZpbHRlcjogKGZpbHRlcikgPT5cbiAgICBpZiBmaWx0ZXIgaW5zdGFuY2VvZiBqUXVlcnkuRXZlbnRcbiAgICAgIGZpbHRlci5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAkZmlsdGVyID0gJChmaWx0ZXIudGFyZ2V0KS5jbG9zZXN0KCcubWFwLWZpbHRlcicpXG4gICAgICBmaWx0ZXIgPSAkZmlsdGVyLmF0dHIoJ2RhdGEtZmlsdGVyJylcblxuICAgIGlmIChmaWx0ZXIgPT0gXCJhbGxcIiB8fCBmaWx0ZXIgaW4gQGZpbHRlcilcbiAgICAgICRmaWx0ZXIucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIuc3BsaWNlKEBmaWx0ZXIuaW5kZXhPZihmaWx0ZXIpLCAxKVxuICAgIGVsc2VcbiAgICAgICRmaWx0ZXIuYWRkQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIucHVzaChmaWx0ZXIpXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3NlYXJjaC5jaGFuZ2UnLCB7QGZpbHRlcn0pXG5cbiAgICByZXR1cm4gQFxuIiwiIyMjXG4jIFBvcGluXG4jIyBDcmVhdGUgYSBwb3BpblxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBvcGluXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50KSAtPlxuICAgIEBpZCA9ICdwb3Bpbi0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICBAJHdyYXBwZXIgPSAkKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwicG9waW4td3JhcCBjbG9zZVwiIC8+JylcbiAgICBAJGNsb3NlQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInBvcGluLWNsb3NlXCI+Y2xvc2U8L2J1dHRvbj4nKVxuICAgIEAkZWwgPSAkKCc8ZGl2IGNsYXNzPVwicG9waW4tY29udGVudFwiIC8+JylcblxuXG4gICAgQCR3cmFwcGVyLmFwcGVuZChAJGNsb3NlQnRuKVxuICAgIEAkd3JhcHBlci5hcHBlbmQoQCRlbClcbiAgICBAJHBhcmVudCA9ICQocGFyZW50KS5hcHBlbmQoQCR3cmFwcGVyKVxuXG4gICAgQCRjbG9zZUJ0bi5vbiBcImNsaWNrXCIsIEBjbG9zZVxuXG4gICAgQCRwYXJlbnQub24gXCJsaXN0Lm9wZW5cIiwgQGNsb3NlXG4gICAgQCRwYXJlbnQub24gXCJsaXN0LmNsb3NlXCIsIEBvcGVuXG5cbiAgICByZXR1cm4gQFxuXG4gICMgIyMgc2V0Q29udGVudFxuICBzZXRDb250ZW50OiAoY29udGVudCkgLT5cbiAgICBAJGVsLmh0bWwoY29udGVudClcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgc2hvd1xuICBvcGVuOiAoKSA9PlxuICAgIEAkd3JhcHBlci5hZGRDbGFzcyhcIm9wZW5cIilcbiAgICBAJHdyYXBwZXIucmVtb3ZlQ2xhc3MoXCJjbG9zZVwiKVxuICAgIEAkd3JhcHBlci50cmlnZ2VyKFwicG9waW4ub3BlblwiKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjbG9zZVxuICBjbG9zZTogKCkgPT5cbiAgICBAJHdyYXBwZXIuYWRkQ2xhc3MoXCJjbG9zZVwiKVxuICAgIEAkd3JhcHBlci5yZW1vdmVDbGFzcyhcIm9wZW5cIilcbiAgICBAJHdyYXBwZXIudHJpZ2dlcihcInBvcGluLmNsb3NlXCIpXG5cbiAgICByZXR1cm4gQFxuIiwiIyMjXG4jIE1hcmtlclxuIyMgRXh0ZW5kcyBnb29nbGUubWFwcy5NYXJrZXIgdG8gZW5hYmxlIGZpbHRlcmluZ1xuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE1hcmtlciBleHRlbmRzIGdvb2dsZS5tYXBzLk1hcmtlclxuICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgc3VwZXIgYXJnc1xuXG4gICAgQGVuZ2luZXMgPSBuZXcgT2JqZWN0KClcblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIEBnZXRNYXAoKSwgJ3NlYXJjaC5jaGFuZ2UnLCBAZmlsdGVyXG5cbiAgIyAjIyBnZXRGaWVsZFxuICBnZXRGaWVsZDogKGZpZWxkKSAtPlxuICAgIHJldHVybiBAW2ZpZWxkXS50b1N0cmluZygpXG5cbiAgIyAjIyBmaWx0ZXJcbiAgZmlsdGVyOiAocmVzdWx0cykgPT5cbiAgICAjIGdldCB0aGUgZW5naW5lIGluZGVudGlmaWVyXG4gICAgaWYgcmVzdWx0c1syXVxuICAgICAgZW5naW5lSWQgPSByZXN1bHRzWzJdXG4gICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgYHNlYXJjaC5jaGFuZ2VgIHB1c3QgcGFzcyBhbiBzdHJpbmcgaWRlbnRpZmllciBhcyB0aHJpZCBhcmd1bWVudFwiKVxuXG4gICAgIyBSZWdpc3RlciB0aGUgZW5naW5lIG9uIHRoZSBmaXJzdCBmaWx0ZXJcbiAgICB1bmxlc3MgQGVuZ2luZXNbZW5naW5lSWRdXG4gICAgICBAZW5naW5lc1tlbmdpbmVJZF0gPSBuZXcgT2JqZWN0KClcblxuICAgIEBlbmdpbmVzW2VuZ2luZUlkXS5maWVsZCA9IHJlc3VsdHNbMV1cbiAgICBAZW5naW5lc1tlbmdpbmVJZF0ucmVzdWx0cyA9IHJlc3VsdHNbMF1cblxuICAgIGZvciBlbmdpbmVJZCBvZiBAZW5naW5lc1xuICAgICAgZW5naW5lID0gQGVuZ2luZXNbZW5naW5lSWRdXG4gICAgICBpZiAhZW5naW5lLnJlc3VsdHMubGVuZ3RoIHx8IEBnZXRGaWVsZChlbmdpbmUuZmllbGQpIGluIGVuZ2luZS5yZXN1bHRzXG4gICAgICAgIEBzZXRWaXNpYmxlKHRydWUpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICByZXR1cm4gQFxuICAgIHJldHVybiBAIiwiUG9waW4gPSByZXF1aXJlKCcuL1BvcGluLmNvZmZlZScpXG5cbiMjI1xuIyBMaXN0XG4jIyBMaXN0IE1hcmtlclxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExpc3QgZXh0ZW5kcyBQb3BpblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgdGVtcGxhdGUpIC0+XG4gICAgQGlkID0gJ2xpc3QtY29udGVudC0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICBAJHBhcmVudCA9ICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJsaXN0LWNvbnRlbnQgY2xvc2VcIiAvPicpXG4gICAgQCRlbCA9IEAkcGFyZW50LmZpbmQoJy5saXN0LWNvbnRlbnQnKVxuICAgIEBtYXJrZXJzID0gbmV3IEFycmF5KClcblxuICAgICQuZ2V0KHRlbXBsYXRlKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoZGF0YSlcbiAgICAgICAgQCRlbC50cmlnZ2VyIFwibG9hZFwiXG5cbiAgICBAJHBhcmVudC5vbiBcInNlYXJjaC5jaGFuZ2VcIiwgKGUpID0+XG4gICAgICAjIGdldCB0aGUgZW5naW5lIGluZGVudGlmaWVyXG4gICAgICBpZiBlLnRhcmdldC5jbGFzc05hbWUgPT0gXCJtYXAtc2VhcmNoXCIgdGhlbiBAb3BlbigpXG5cbiAgICBAJHBhcmVudC5vbiBcInBvcGluLm9wZW5cIiwgQGNsb3NlXG4gICAgQCRwYXJlbnQub24gXCJwb3Bpbi5jbG9zZVwiLCBAb3BlblxuXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGFkZE1hcmtlclxuICBhZGRNYXJrZXI6IChtYXJrZXIpIC0+XG4gICAgQG1hcmtlcnMucHVzaChtYXJrZXIpXG4gICAgQHJlbmRlcihAbWFya2VycylcblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIG1hcmtlciwgJ3Zpc2libGVfY2hhbmdlZCcsIChlKSA9PlxuICAgICAgaWYgbWFya2VyLnZpc2libGUgdGhlbiBAc2hvd01hcmtlcihtYXJrZXIpIGVsc2UgQGhpZGVNYXJrZXIobWFya2VyKVxuXG5cbiAgIyAjIyBzaG93TWFya2VyXG4gIHNob3dNYXJrZXI6IChtYXJrZXIpIC0+XG4gICAgQCRlbC5maW5kKCdbZGF0YS1pbmRleD1cIicrbWFya2VyLmdldEZpZWxkKFwiaW5kZXhcIikrJ1wiXScpLnNob3coKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBoaWRlTWFya2VyXG4gIGhpZGVNYXJrZXI6IChtYXJrZXIpIC0+XG4gICAgQCRlbC5maW5kKCdbZGF0YS1pbmRleD1cIicrbWFya2VyLmdldEZpZWxkKFwiaW5kZXhcIikrJ1wiXScpLmhpZGUoKVxuICAgIHJldHVybiBAXG5cblxuICAjICMjIHNob3dcbiAgb3BlbjogKCkgPT5cbiAgICB1bmxlc3MgQCRlbC5oYXNDbGFzcyhcIm9wZW5cIilcbiAgICAgIEAkZWwuYWRkQ2xhc3MoXCJvcGVuXCIpXG4gICAgICBAJGVsLnJlbW92ZUNsYXNzKFwiY2xvc2VcIilcbiAgICAgIEAkZWwudHJpZ2dlcihcImxpc3Qub3BlblwiKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjbG9zZVxuICBjbG9zZTogKCkgPT5cbiAgICB1bmxlc3MgQCRlbC5oYXNDbGFzcyhcImNsb3NlXCIpXG4gICAgICBAJGVsLmFkZENsYXNzKFwiY2xvc2VcIilcbiAgICAgIEAkZWwucmVtb3ZlQ2xhc3MoXCJvcGVuXCIpXG4gICAgICBAJGVsLnRyaWdnZXIoXCJsaXN0LmNsb3NlXCIpXG5cbiAgIyAjIyByZW5kZXJcbiAgcmVuZGVyOiAobWFya2VycykgLT5cbiAgICBAc2V0Q29udGVudChAdGVtcGxhdGUobWFya2VyczogbWFya2VycykpXG4gICAgQCRjbG9zZUJ0biA9IEAkcGFyZW50LmZpbmQoJy5saXN0LWNsb3NlJylcbiAgICBAJGNsb3NlQnRuLm9uIFwiY2xpY2tcIiwgQGNsb3NlXG5cbiAgICB1bmxlc3MgQCRlbC5maW5kKCdbZGF0YS1pbmRleF0nKS5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGF0dHJpYnV0ZSBgZGF0YS1pbmRleD1cIjwlPW1hcmtlci5pbmRleCU+YCBpcyByZXF1aXJlZCBpbiB0ZW1wbGF0ZSBmaWxlXCIgJylcblxuICAgIEAkZWwuZmluZCgnW2RhdGEtaW5kZXhdJykub24gXCJjbGlja1wiLCAoZSkgPT5cbiAgICAgIEBjbG9zZSgpXG4gICAgICBpbmRleCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ1tkYXRhLWluZGV4XScpLmF0dHIoXCJkYXRhLWluZGV4XCIpXG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyIG1hcmtlcnNbaW5kZXhdLCAnY2xpY2snXG5cbiAgICByZXR1cm4gQFxuIl19
;