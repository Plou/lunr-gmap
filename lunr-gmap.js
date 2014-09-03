;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var Filters, Gmap, LunrGmap, Marker, Popin, Search,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Gmap = require('./Gmap.coffee');

  Search = require('./Search.coffee');

  Popin = require('./Popin.coffee');

  Filters = require('./Filters.coffee');

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
      this.checkDependencies();
      this.$el = $(this.selector);
      if (this.$el.length > 1) {
        throw new Error("selector argument must refer to an unique node");
      }
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
        return google.maps.event.addListener(_this.map.gmap, 'search.change', function(result) {
          if (result[2] === "lunr") {
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
        return google.maps.event.trigger(_this.map.gmap, "search.change", [data.refs, "index", "lunr"]);
      });
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

}).call(this);


},{"./Gmap.coffee":2,"./Search.coffee":3,"./Popin.coffee":4,"./Filters.coffee":5,"./Marker.coffee":6}],2:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
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
      google.maps.event.addListener(this.getMap(), 'search.change', this.filter);
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvaG9tZS9jcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9GaWx0ZXJzLmNvZmZlZSIsIi9ob21lL2NwbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL01hcmtlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSx3Q0FBQTtLQUFBLDZFQUFBOztDQUFBLENBQUEsQ0FBTyxDQUFQLEdBQU8sUUFBQTs7Q0FBUCxDQUNBLENBQVMsR0FBVCxDQUFTLFVBQUE7O0NBRFQsQ0FFQSxDQUFRLEVBQVIsRUFBUSxTQUFBOztDQUZSLENBR0EsQ0FBVSxJQUFWLFdBQVU7O0NBSFYsQ0FJQSxDQUFTLEdBQVQ7O0NBRUE7Ozs7OztDQU5BOztDQUFBLENBYUEsQ0FBdUIsR0FBakIsQ0FBTjtDQUNlLEVBQUEsQ0FBQSxJQUFBLFVBQUU7Q0FFYixTQUFBLEVBQUE7Q0FBQSxFQUZhLENBQUEsRUFBRCxFQUVaO0NBQUEsOERBQUE7Q0FBQSxzRUFBQTtDQUFBLEVBQ0UsQ0FERCxFQUFEO0NBQ0UsQ0FBSyxDQUFMLEVBQUEsR0FBQTtDQUFBLENBQ00sRUFBTixDQURBLEdBQ0E7Q0FGRixPQUFBO0NBQUEsRUFLRSxDQURELEVBQUQsR0FBQTtDQUNFLENBQVEsSUFBUixFQUFBO0NBQUEsQ0FDTSxFQUFOLElBQUE7Q0FORixPQUFBO0NBQUEsR0FRQyxFQUFELFdBQUE7Q0FSQSxFQVdBLENBQUMsRUFBRCxFQUFPO0NBQ1AsRUFBTyxDQUFKLEVBQUg7Q0FDRSxHQUFVLENBQUEs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QVNROztDQVRSOztDQURvQyxHQUFXLEVBQUw7Q0FKNUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIkdtYXAgPSByZXF1aXJlKCcuL0dtYXAuY29mZmVlJylcblNlYXJjaCA9IHJlcXVpcmUoJy4vU2VhcmNoLmNvZmZlZScpXG5Qb3BpbiA9IHJlcXVpcmUoJy4vUG9waW4uY29mZmVlJylcbkZpbHRlcnMgPSByZXF1aXJlKCcuL0ZpbHRlcnMuY29mZmVlJylcbk1hcmtlciA9IHVuZGVmaW5lZFxuXG4jIyNcbiMgTHVuckdtYXBcbiMjIENyZWF0ZSBhIGdvb2dsZSBtYXAgdmlldyBmcm9tIGEgZmVlZCB3aXRoIGx1bnIgc2VhcmNoIGFuZCBjYXRlZ29yeSBuYXZpZ2F0aW9uXG4jIE1hbmFnZSBpbml0aWFsaXphdGlvbiwgbG9hZGluZyBhbmQgZXZlbnRzXG4jIEhhbmRsZSB0aGUgZGlzcGxheSBvZiBjb250ZW50cyBhbmQgcmVzdWx0cyBsaXN0XG4jIyNcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMdW5yR21hcFxuICBjb25zdHJ1Y3RvcjogKEBzZWxlY3RvcikgLT5cbiAgICAjIExvYWRlciBzdG9yZXMgdGhlIGxvYWQgc3RhdGUgb2YgbWFwIGFuZCBmZWVkXG4gICAgQGxvYWRlciA9XG4gICAgICBtYXA6IGZhbHNlXG4gICAgICBmZWVkOiBmYWxzZVxuICAgICMgVW5kZXJzY29yZSB0ZW1wbGF0ZXNcbiAgICBAdGVtcGxhdGVzID1cbiAgICAgIHNpbmdsZTogXCJcIlxuICAgICAgbGlzdDogXCJcIlxuXG4gICAgQGNoZWNrRGVwZW5kZW5jaWVzKCk7XG5cbiAgICAjIFJldHJpZXZlIG9wdGlvbnMgZnJvbWUgZWxlbWVudCBhdHRyaWJ1dGVzXG4gICAgQCRlbCA9ICQoQHNlbGVjdG9yKVxuICAgIGlmIEAkZWwubGVuZ3RoID4gMVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2VsZWN0b3IgYXJndW1lbnQgbXVzdCByZWZlciB0byBhbiB1bmlxdWUgbm9kZVwiKVxuXG4gICAgQHRlbXBsYXRlcy5zaW5nbGUgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVTaW5nbGUnKVxuICAgIEB0ZW1wbGF0ZXMubGlzdCA9IEAkZWwuYXR0cignZGF0YS10ZW1wbGF0ZUxpc3QnKVxuICAgIEBmaWVsZHMgPSBAcGFyc2VGaWVsZHMoQCRlbC5hdHRyKCdkYXRhLWx1bnInKSlcbiAgICBAZmlsdGVyID0gQCRlbC5hdHRyKCdkYXRhLWZpbHRlcicpXG5cbiAgICBAaW5pdEdtYXAoKVxuXG4gICAgIyBDcmVhdGUgYSBwb3BpbiB0byBkaXNwbGF5IHJlc3VsdHNcbiAgICBAcG9waW4gPSBuZXcgUG9waW4oQHNlbGVjdG9yKVxuXG4gICAgIyBHZXQgdGhlIGZlZWRcbiAgICAkLmdldChAJGVsLmF0dHIoJ2RhdGEtZmVlZCcpKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEBmZWVkID0gZGF0YVxuICAgICAgICBAaW5pdEZlZWQoKVxuICAgICAgICBAaW5pdEZpbHRlcnMoKVxuXG4gICAgIyBHZXQgdGVtcGxhdGVzXG4gICAgJC5nZXQoQHRlbXBsYXRlcy5zaW5nbGUpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlcy5zaW5nbGUgPSBfLnRlbXBsYXRlKGRhdGEpXG5cbiAgICAkLmdldChAdGVtcGxhdGVzLmxpc3QpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQHRlbXBsYXRlcy5saXN0ID0gXy50ZW1wbGF0ZShkYXRhKVxuXG4gICMgIyMgaW5pdEdtYXBcbiAgaW5pdEdtYXA6IC0+XG4gICAgIyBDcmVhdGUgYSBuZXcgR21hcCBvYmplY3RcbiAgICBAbWFwID0gbmV3IEdtYXAoQHNlbGVjdG9yLCBAJGVsLmF0dHIoJ2RhdGEtbGF0aXR1ZGUnKSwgQCRlbC5hdHRyKCdkYXRhLWxvbmdpdHVkZScpLCBwYXJzZUludChAJGVsLmF0dHIoJ2RhdGEtem9vbScpKSlcbiAgICAjIExpc3RlbiB0byBtYXAgbG9hZGluZ1xuICAgIEBtYXAuJGVsLm9uIFwibG9hZFwiLCA9PlxuICAgICAgQGxvYWRlci5tYXAgPSB0cnVlXG4gICAgICAjIE9uY2UgdGhlIG1hcCBpcyBsb2FkZWQgd2UgY2FuIGdldCB0aGUgTWFya2VyIG9iamVjdCB3aGljaCBleHRlbmQgYGdvb2dsZS5tYXBzLk1hcmtlcmBcbiAgICAgIE1hcmtlciA9IHJlcXVpcmUoJy4vTWFya2VyLmNvZmZlZScpXG4gICAgICAjIEluaXQgbWFya2VyIGlmIHRoZSBmZWVkIGlzIGxvYWRlZFxuICAgICAgaWYgQGxvYWRlci5mZWVkXG4gICAgICAgICMgV2UgY2FuIG5vdyBhZGQgbWFya2VycyBmcm9tIHRoZSBmZWVkIHRvIHRoZSBtYXBcbiAgICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG5cbiAgICAgICMgTGlzdGVuIHRvIG1hcCBgc2VhcmNoLmNoYW5nZWRgIGZyb20gbHVuciB0byBkaXNwbGF5IGEgbGlzdCBvZiByZXN1bHRzXG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBAbWFwLmdtYXAsICdzZWFyY2guY2hhbmdlJywgKHJlc3VsdCkgPT5cbiAgICAgICAgaWYgcmVzdWx0WzJdID09IFwibHVuclwiXG4gICAgICAgICAgQGRpc3BsYXlNYXJrZXJzRnJvbVJlZnMocmVzdWx0WzBdKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBpbml0RmVlZFxuICBpbml0RmVlZDogKCktPlxuICAgIEBsb2FkZXIuZmVlZCA9IHRydWVcblxuICAgICMgSW5pdCBtYXJrZXIgaWYgdGhlIG1hcCBpcyBsb2FkZWRcbiAgICBpZiBAbG9hZGVyLm1hcFxuICAgICAgIyBXZSBjYW4gbm93IGFkZCBtYXJrZXJzIGZyb20gdGhlIGZlZWQgdG8gdGhlIG1hcFxuICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG5cbiAgICAjIEluaXQgbHVuciBzZWFyY2ggZW5naW5lXG4gICAgQHNlYXJjaCA9IG5ldyBTZWFyY2goQHNlbGVjdG9yLCBAZmVlZCwgQGZpZWxkcylcbiAgICAjIE9uIGx1bnIgYHNlYXJjaC5jaGFuZ2VzYCB3ZSB0cmlnZ2VyIHRoZSBzYW1lIGV2ZW50IG9uIG1hcFxuICAgIEBzZWFyY2guJGVsLm9uIFwic2VhcmNoLmNoYW5nZVwiLCAoZSwgZGF0YSkgPT5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VcIiwgW2RhdGEucmVmcywgXCJpbmRleFwiLCBcImx1bnJcIl1cblxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBpbml0RmlsdGVyc1xuICBpbml0RmlsdGVyczogKCktPlxuICAgIEBmaWx0ZXJzID0gbmV3IEZpbHRlcnMoQHNlbGVjdG9yLCBAZmVlZCwgQGZpbHRlciwgQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlRmlsdGVycycpKVxuICAgICMgT24gZmlsdGVycyBgc2VhcmNoLmNoYW5nZXNgIHdlIHRyaWdnZXIgdGhlIHNhbWUgZXZlbnQgb24gbWFwXG4gICAgQGZpbHRlcnMuJGVsLm9uIFwic2VhcmNoLmNoYW5nZVwiLCAoZSwgZGF0YSkgPT5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VcIiwgW2RhdGEuZmlsdGVyLCBAZmlsdGVyLCBcImZpbHRlcnNcIl1cblxuICAjICMjIGFkZE1hcmtlcnNcbiAgYWRkTWFya2VyczogKGRhdGEpIC0+XG4gICAgQG1hcmtlcnMgPSBuZXcgQXJyYXlcbiAgICAjIEZvciBlYWNoIG9iamVjdCBvZiB0aGUgZmVlZCB3ZSBhZGQgYSBtYXJrZXJcbiAgICBmb3IgbWFya2VyIGluIGRhdGFcbiAgICAgIEBhZGRNYXJrZXIobWFya2VyKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBhZGRNYXJrZXJcbiAgYWRkTWFya2VyOiAoZGF0YSktPlxuICAgIGRhdGEucG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGRhdGEubGF0aXR1ZGUsZGF0YS5sb25naXR1ZGUpXG4gICAgZGF0YS5tYXAgPSBAbWFwLmdtYXBcblxuICAgIG1hcmtlciA9IG5ldyBNYXJrZXIoZGF0YSlcbiAgICBAbWFya2Vycy5wdXNoKG1hcmtlcilcblxuICAgICMgTGlzdGVuIHRvIG1hcmtlciBjbGljayBldmVudCB0byBkaXNwbHkgdGhlIG1hcmtlcidzIGNvbnRlbnRcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBtYXJrZXIsICdjbGljaycsICgpID0+XG4gICAgICBAZGlzcGxheVNpbmdsZShtYXJrZXIpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGRpc3BsYXlTaW5nbGVcbiAgZGlzcGxheVNpbmdsZTogKG1hcmtlcikgLT5cbiAgICBAcG9waW4uc2V0Q29udGVudChAdGVtcGxhdGVzLnNpbmdsZShtYXJrZXIpKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBkaXNwbGF5TGlzdFxuICBkaXNwbGF5TGlzdDogKG1hcmtlcnMpIC0+XG4gICAgQHBvcGluLnNldENvbnRlbnQoQHRlbXBsYXRlcy5saXN0KG1hcmtlcnM6IG1hcmtlcnMpKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBkaXNwbGF5TWFya2Vyc0Zyb21SZWZzXG4gIGRpc3BsYXlNYXJrZXJzRnJvbVJlZnM6IChyZXN1bHQpID0+XG4gICAgQGRpc3BsYXlMaXN0KEBnZXRNYXJrZXJzRnJvbVJlZnMocmVzdWx0KSlcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgcGFyc2VGaWVsZHNcbiAgIyBHZXQgZmllbGRzIHRvIHNlYXJjaCBmcm9tIGBkYXRhLWx1bnJgIGF0dHJpYnV0ZVxuICBwYXJzZUZpZWxkczogKGRhdGEpIC0+XG4gICAgZmllbGRzID0gbmV3IEFycmF5KClcbiAgICBmb3IgZmllbGQgaW4gZGF0YS5zcGxpdCgnLCcpXG4gICAgICBmaWVsZCA9IGZpZWxkLnNwbGl0KCd8JylcbiAgICAgIGZpZWxkcy5wdXNoKFtmaWVsZFswXSwgcGFyc2VJbnQoZmllbGRbMV0pXSlcbiAgICByZXR1cm4gZmllbGRzXG5cbiAgIyAjIyBnZXRNYXJrZXJzRnJvbVJlZnNcbiAgIyBHZXQgYSBtYXJrZXIgZnJvbSBhIGluZGV4IGFycmF5XG4gIGdldE1hcmtlcnNGcm9tUmVmczogKHJlc3VsdCkgPT5cbiAgICBtYXJrZXJzID0gbmV3IEFycmF5KClcbiAgICBpZiByZXN1bHQubGVuZ3RoXG4gICAgICBmb3IgaW5kZXggaW4gcmVzdWx0XG4gICAgICAgIG1hcmtlcnMucHVzaCBAbWFya2Vyc1tpbmRleF1cbiAgICByZXR1cm4gbWFya2Vyc1xuXG4gICMgIyMgY2hlY2tEZXBlbmRlbmNpZXNcbiAgIyBDaGVja3MgaWYgalF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBpbmNsdWRlZFxuICBjaGVja0RlcGVuZGVuY2llczogLT5cbiAgICBpZiAhJD8gdGhlbiB0aHJvdyBuZXcgRXJyb3IoJ2pRdWVyeSBub3QgZm91bmQnKVxuICAgIGlmICFfPyB0aGVuIHRocm93IG5ldyBFcnJvcigndW5kZXJzY29yZSBub3QgZm91bmQnKVxuXG4jIEV4cG9ydCB0aGUgY2xhc3MgdG8gdGhlIGdsb2JhbCBzY29wZVxud2luZG93Lkx1bnJHbWFwID0gTHVuckdtYXBcbiIsIiMjI1xuIyBHbWFwXG4jIyBNYW5hZ2UgZ29vZ2xlIG1hcCBpbml0aWFsaXphdGlvbiBhbmQgcmVuZGVyaW5nXG4jIFBhcmFtZXRlcnMgOlxuIyAgIC0gcGFyZW50IDogVGhlIGRvbSBzZWxlY3RvciB3ZXJlIHRoZSBtYXAgbXVzdCBiZSBhZGRlZFxuIyAgIC0gbGF0aXR1ZGUgOiBVc2VkIHRvIGNlbnRlciB0aGUgbWFwXG4jICAgLSBsb25naXR1ZGUgOiBVc2VkIHRvIGNlbnRlciB0aGUgbWFwXG4jICAgLSB6b29tIDogWm9vbSB1c2VkXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgR21hcFxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgQGxhdGl0dWRlLCBAbG9uZ2l0dWRlLCBAem9vbSkgLT5cbiAgICAjIFNldCBhbiB1bmlxdWUgaWRcbiAgICBAaWQgPSAnbWFwLWNhbnZhcy0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICAjIENyZWF0ZSB0aGUgdmlldyBub2RlXG4gICAgJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cIm1hcC1jYW52YXNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcblxuICAgIEB6b29tID0gNCB1bmxlc3MgQHpvb21cbiAgICBAbG9hZEdvb2dsZU1hcHMoKVxuXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGxvYWRHb29nbGVNYXBzXG4gIGxvYWRHb29nbGVNYXBzOiAoKSAtPlxuICAgICMgR2V0IHRoZSBnb29nbGUgbWFwIHNjcmlwdFxuICAgICQuZ2V0U2NyaXB0ICdodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpJywgPT5cbiAgICAgIGdvb2dsZS5sb2FkICdtYXBzJywgJzMnLFxuICAgICAgICBvdGhlcl9wYXJhbXM6ICdzZW5zb3I9ZmFsc2UnXG4gICAgICAgIGNhbGxiYWNrOiBAY3JlYXRlXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGNyZWF0ZVxuICBjcmVhdGU6ICgpID0+XG4gICAgIyBPcHRpb25zXG4gICAgc3R5bGVzID0gW1xuICAgICAgZmVhdHVyZVR5cGU6IFwicG9pXCJcbiAgICAgIGVsZW1lbnRUeXBlOiBcImxhYmVsc1wiXG4gICAgICBzdHlsZXJzOiBbXG4gICAgICAgIHZpc2liaWxpdHk6IFwib2ZmXCJcbiAgICAgIF1cbiAgICBdXG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGdvb2dsZSBtYXBcbiAgICBAZ21hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoQGlkKSxcbiAgICAgIHpvb206IEB6b29tLFxuICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKEBsYXRpdHVkZSxAbG9uZ2l0dWRlKVxuICAgICAgdmlzdWFsUmVmcmVzaDogdHJ1ZVxuICAgICAgZGlzYWJsZURlZmF1bHRVSTogdHJ1ZVxuICAgICAgc3R5bGVzOiBzdHlsZXNcblxuICAgIEAkZWwudHJpZ2dlcihcImxvYWRcIilcbiAgICByZXR1cm4gQFxuIiwiIyMjXG4jIFNlYXJjaFxuIyMgTWFuYWdlIGx1bnIgc2VhcmNoIGVuZ2luZVxuIyBQYXJhbWV0ZXJzIDpcbiMgICAtIHBhcmVudCA6IFRoZSBkb20gc2VsZWN0b3Igd2VyZSB0aGUgc2VhcmNoIGZpZWxkIG11c3QgYmUgYWRkZWRcbiMgICAtIGRhdGEgOiBUaGUgZGF0YSB0byBzZWFyY2hcbiMgICAtIGZpZWxkcyA6IFRoZSBmaWVsZHMgdG8gc2VhcmNoXG4jICAgLSBldmVudCA6IHNlYXJjaCBpbnB1dCBldmVudCB3aGljaCB0cmlnZ2VyIHRoZSBzZWFyY2hcbiMgICAtIHNjb3JlIDogVGhlIG1pbmltdW0gc2NvcmUgcmVxdWlyZWQgdG8gc2hvdyB1cCBpbiByZXN1bHRzXG4jIyNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VhcmNoXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBkYXRhLCBmaWVsZHMsIGV2ZW50LCBzY29yZSkgLT5cbiAgICAjIENyZWF0ZSB0aGUgc2VhcmNoIGZpZWxkXG4gICAgQCRlbCA9ICQoJzxkaXYgY2xhc3M9XCJtYXAtc2VhcmNoXCIgLz4nKVxuICAgICQocGFyZW50KS5hcHBlbmQoQCRlbClcbiAgICBAJGlucHV0ID0gJCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgLz4nKVxuICAgIEAkZWwuYXBwZW5kKEAkaW5wdXQpXG5cbiAgICBAcmVmcyA9IEByZXN1bHRzID0gbmV3IEFycmF5KClcbiAgICBAc2NvcmUgPSAwIHVubGVzcyBzY29yZVxuICAgIGV2ZW50ID0gXCJrZXl1cFwiIHVubGVzcyBldmVudFxuXG4gICAgIyBJbml0aWFsaXplIGx1bnIgZmllbGRzXG4gICAgQGluZGV4ID0gbHVuciAtPlxuICAgICAgZm9yIGZpZWxkIGluIGZpZWxkc1xuICAgICAgICB0aGlzLmZpZWxkKGZpZWxkWzBdLCBmaWVsZFsxXSlcbiAgICAgICAgdGhpcy5yZWYoJ2luZGV4JylcblxuICAgIEAkaW5wdXQub24gZXZlbnQsIEBpbml0U2VhcmNoXG5cbiAgICAjIGFkZCBvYmplY3RzIHRvIGx1bnJcbiAgICBpZiBkYXRhP1xuICAgICAgZm9yIGl0ZW0gaW4gZGF0YVxuICAgICAgICBAaW5kZXguYWRkKGl0ZW0pXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3JlYWR5JylcbiAgICByZXR1cm4gQFxuXG4gICMgIyMgaW5pdFNlYXJjaFxuICBpbml0U2VhcmNoOiAoKSA9PlxuICAgIEBmaWx0ZXIoKVxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAcmVmc30pXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGdldFJlc3VsdHNcbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXR1cm4gQHJlc3VsdHNcblxuICAjICMjIGdldFJlZnNcbiAgZ2V0UmVmczogKCkgLT5cbiAgICByZXR1cm4gQHJlZnNcblxuICAjICMjIGZpbHRlclxuICBmaWx0ZXI6IC0+XG4gICAgQHJlc3VsdHMgPSBAaW5kZXguc2VhcmNoKEBnZXRGaWx0ZXIoKSlcbiAgICBAcmVmcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIHJlc3VsdCBpbiBAcmVzdWx0c1xuICAgICAgaWYgcmVzdWx0LnNjb3JlID49IEBzY29yZVxuICAgICAgICBAcmVmcy5wdXNoKHJlc3VsdC5yZWYpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGNsZWFyXG4gIGNsZWFyOiAtPlxuICAgIEAkaW5wdXQudmFsKFwiXCIpXG4gICAgQGZpbHRlcigpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIGdldEZpbHRlclxuICAjIFJldHVybiB0aGUgc2VhcmNoIHN0cmluZ1xuICBnZXRGaWx0ZXI6IC0+XG4gICAgcmV0dXJuIEAkaW5wdXQudmFsKClcbiIsIiMjI1xuIyBQb3BpblxuIyMgQ3JlYXRlIGEgcG9waW5cbiMjI1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQb3BpblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCkgLT5cbiAgICBAaWQgPSAncG9waW4tY29udGVudC0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICBAJHBhcmVudCA9ICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJwb3Bpbi1jb250ZW50XCIgLz4nKVxuICAgIEAkZWwgPSBAJHBhcmVudC5maW5kKCcucG9waW4tY29udGVudCcpXG4gICAgQCRjbG9zZUJ0biA9IEAkcGFyZW50LmZpbmQoJy5jbG9zZScpXG4gICAgQCRjbG9zZUJ0bi5vbiBcImNsaWNrXCIsIEBjbG9zZVxuXG4gICAgcmV0dXJuIEBcblxuICAjICMjIHNldENvbnRlbnRcbiAgc2V0Q29udGVudDogKGNvbnRlbnQpIC0+XG4gICAgQCRlbC5odG1sKGNvbnRlbnQpXG4gICAgcmV0dXJuIEBcblxuICAjICMjIHNob3dcbiAgb3BlbjogKCkgPT5cbiAgICBAJHBhcmVudC5hZGRDbGFzcyhcIm9wZW5cIilcbiAgICBAJHBhcmVudC50cmlnZ2VyKFwib3BlblwiKVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyBjbG9zZVxuICBjbG9zZTogKCkgPT5cbiAgICBAJHBhcmVudC50cmlnZ2VyKFwiY2xvc2VcIilcbiAgICBAJHBhcmVudC5yZW1vdmVDbGFzcyhcIm9wZW5cIilcblxuICAgIHJldHVybiBAXG4iLCIjIyNcbiMgRmlsdGVyc1xuIyMgTWFuYWdlIGZpbHRlcnNcbiMgUGFyYW1ldGVycyA6XG4jICAgLSBwYXJlbnQgOiBUaGUgZG9tIHNlbGVjdG9yIHdlcmUgdGhlIGZpbHRlciBuYXZpZ2F0aW9uIG11c3QgYmUgYWRkZWRcbiMgICAtIGRhdGEgOiBUaGUgZGF0YSB0byBzZWFyY2hcbiMgICAtIGZpZWxkcyA6IFRoZSBmaWVsZCB0byBmaWx0ZXJcbiMgICAtIEB0ZW1wbGF0ZSA6IFRoZSB0ZW1wbGF0ZSB0byBidWlsZCB0aGUgbmF2aWdhdGlvblxuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZpbHRlcnNcbiAgY29uc3RydWN0b3I6IChwYXJlbnQsIGRhdGEsIGZpZWxkLCBAdGVtcGxhdGUpIC0+XG4gICAgIyBTZXQgYW4gdW5pcXVlIGlkXG4gICAgQGlkID0gJ21hcC1maWx0ZXJzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICMgQ3JlYXRlIHRoZSB2aWV3IG5vZGVcbiAgICAkKHBhcmVudCkuYXBwZW5kKCc8ZGl2IGlkPVwiJytAaWQrJ1wiIGNsYXNzPVwibWFwLWZpbHRlcnNcIiAvPicpXG4gICAgQCRlbCA9ICQoJyMnK0BpZClcblxuICAgIEBwYXJzZURhdGEgZGF0YSwgZmllbGRcbiAgICBAZmlsdGVyID0gbmV3IEFycmF5KClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGUgPSBfLnRlbXBsYXRlKGRhdGEpXG4gICAgICAgIEByZW5kZXIoKVxuICAgICAgICAjIGdldCBhbGwgbmF2aWdhdGlvbiBpdGVtcyAoZmlsdGVycykgYW5kIGJpbmQgY2xpY2tzXG4gICAgICAgIEAkZmlsdGVyQnRucyA9IEAkZWwuZmluZCgnLm1hcC1maWx0ZXInKVxuICAgICAgICBAJGZpbHRlckJ0bnMub24gXCJjbGlja1wiLCBAc2V0RmlsdGVyXG5cbiAgICByZXR1cm4gQFxuXG4gICMgIyMgcGFyc2VEYXRhXG4gICMgR2V0IGFsbCB1bmlxdWUgZmllbGQgdmFsdWVzXG4gIHBhcnNlRGF0YTogKGRhdGEsIGZpZWxkKSAtPlxuICAgIEBmaWx0ZXJzID0gbmV3IEFycmF5KClcbiAgICBmb3IgaXRlbSBpbiBkYXRhXG4gICAgICB1bmxlc3MgaXRlbVtmaWVsZF0gaW4gQGZpbHRlcnNcbiAgICAgICAgQGZpbHRlcnMucHVzaCBpdGVtW2ZpZWxkXVxuICAgIHJldHVybiBAXG5cbiAgIyAjIyByZW5kZXJcbiAgIyBDcmVhdGUgdGhlIG5hdmlnYXRpb24gZnJvbSBmaWx0ZXJzXG4gIHJlbmRlcjogIC0+XG4gICAgQCRlbC5odG1sKEB0ZW1wbGF0ZSh7QGZpbHRlcnN9KSlcblxuICAjICMjIHNldEZpbHRlclxuICAjICMjIEVuYWJsZS9kaXNhYmxlIGEgZmlsdGVyXG4gIHNldEZpbHRlcjogKGZpbHRlcikgPT5cbiAgICBpZiBmaWx0ZXIgaW5zdGFuY2VvZiBqUXVlcnkuRXZlbnRcbiAgICAgIGZpbHRlci5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAkZmlsdGVyID0gJChmaWx0ZXIudGFyZ2V0KS5jbG9zZXN0KCcubWFwLWZpbHRlcicpXG4gICAgICBmaWx0ZXIgPSAkZmlsdGVyLmF0dHIoJ2RhdGEtZmlsdGVyJylcblxuICAgIGlmIChmaWx0ZXIgPT0gXCJhbGxcIiB8fCBmaWx0ZXIgaW4gQGZpbHRlcilcbiAgICAgICRmaWx0ZXIucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIuc3BsaWNlKEBmaWx0ZXIuaW5kZXhPZihmaWx0ZXIpLCAxKVxuICAgIGVsc2VcbiAgICAgICRmaWx0ZXIuYWRkQ2xhc3MoXCJhY3RpdmVcIilcbiAgICAgIEBmaWx0ZXIucHVzaChmaWx0ZXIpXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3NlYXJjaC5jaGFuZ2UnLCB7QGZpbHRlcn0pXG5cbiAgICByZXR1cm4gQFxuIiwiIyMjXG4jIE1hcmtlclxuIyMgRXh0ZW5kcyBnb29nbGUubWFwcy5NYXJrZXIgdG8gZW5hYmxlIGZpbHRlcmluZ1xuIyMjXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE1hcmtlciBleHRlbmRzIGdvb2dsZS5tYXBzLk1hcmtlclxuICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgc3VwZXIgYXJnc1xuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIEBnZXRNYXAoKSwgJ3NlYXJjaC5jaGFuZ2UnLCBAZmlsdGVyXG5cbiAgIyAjIyBnZXRGaWVsZFxuICBnZXRGaWVsZDogKGZpZWxkKSAtPlxuICAgIHJldHVybiBAW2ZpZWxkXS50b1N0cmluZygpXG5cbiAgIyAjIyBmaWx0ZXJcbiAgZmlsdGVyOiAocmVzdWx0cykgPT5cbiAgICBpZiAhcmVzdWx0c1swXS5sZW5ndGggfHwgQGdldEZpZWxkKHJlc3VsdHNbMV0pIGluIHJlc3VsdHNbMF1cbiAgICAgIEBzZXRWaXNpYmxlKHRydWUpXG4gICAgZWxzZVxuICAgICAgQHNldFZpc2libGUoZmFsc2UpXG4iXX0=
;