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
      return this;
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
      this.filters.$el.on("search.change", function(e, data) {
        return google.maps.event.trigger(_this.map.gmap, "search.change", [data.filter, _this.filter, "filters"]);
      });
      return this;
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
      return this;
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
      return this;
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
      this.emmitter.trigger("load.update");
      return this;
    };

    return Loader;

  })();

  return;

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
;