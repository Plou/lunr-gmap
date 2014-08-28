;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var Gmap, LunrGmap, Marker, Popin, Search;

  Gmap = require('./Gmap.coffee');

  Search = require('./Search.coffee');

  Popin = require('./Popin.coffee');

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
      this.map = new Gmap(this.selector, this.$el.attr('data-latitude'), this.$el.attr('data-longitude'), parseInt(this.$el.attr('data-zoom')));
      this.map.$el.on("load", function() {
        _this.loader.map = true;
        Marker = require('./Marker.coffee');
        if (_this.loader.feed) {
          return _this.addMarkers(_this.feed);
        }
      });
      $.get(this.$el.attr('data-feed')).done(function(data) {
        _this.feed = data;
        _this.loader.feed = true;
        if (_this.loader.map) {
          _this.addMarkers(_this.feed);
        }
        _this.search = new Search(_this.selector, _this.feed, _this.fields);
        return _this.search.$el.on("search.change", function(e, data) {
          return google.maps.event.trigger(_this.map.gmap, "search.changed", data.refs);
        });
      });
      this.popin = new Popin(this.selector);
      $.get(this.templates.single).done(function(data) {
        return _this.templates.single = _.template(data);
      });
      $.get(this.templates.list).done(function(data) {
        return _this.templates.list = _.template(data);
      });
    }

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


},{"./Gmap.coffee":2,"./Search.coffee":3,"./Popin.coffee":4,"./Marker.coffee":5}],2:[function(require,module,exports){
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
        this.zoom = 1;
      }
      this.loadGoogleMaps();
      return this;
    }

    Gmap.prototype.render = function() {
      return this;
    };

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
      return this.filter();
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
  var Marker,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = Marker = (function(_super) {
    __extends(Marker, _super);

    function Marker(args) {
      this.checkSearch = __bind(this.checkSearch, this);
      Marker.__super__.constructor.call(this, args);
      google.maps.event.addListener(this.getMap(), 'search.changed', this.checkSearch);
    }

    Marker.prototype.getId = function() {
      return this.index.toString();
    };

    Marker.prototype.checkSearch = function(results) {
      var _ref;
      if (!results.length || (_ref = this.getId(), __indexOf.call(results, _ref) >= 0)) {
        return this.setVisible(true);
      } else {
        return this.setVisible(false);
      }
    };

    return Marker;

  })(google.maps.Marker);

}).call(this);


},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9NYXJrZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtDQUFBLEtBQUEsK0JBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxRQUFBOztDQUFQLENBQ0EsQ0FBUyxHQUFULENBQVMsVUFBQTs7Q0FEVCxDQUVBLENBQVEsRUFBUixFQUFRLFNBQUE7O0NBRlIsQ0FHQSxDQUFTLEdBQVQ7O0NBSEEsQ0FLQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsRUFBQSxDQUFBLElBQUEsVUFBRTtDQUNiLFNBQUEsRUFBQTtDQUFBLEVBRGEsQ0FBQSxFQUFELEVBQ1o7Q0FBQSxFQUNFLENBREQsRUFBRDtDQUNFLENBQUssQ0FBTCxFQUFBLEdBQUE7Q0FBQSxDQUNNLEVBQU4sQ0FEQSxHQUNBO0NBRkYsT0FBQTtDQUFBLEVBSUUsQ0FERCxFQUFELEdBQUE7Q0FDRSxDQUFRLElBQVIsRUFBQTtDQUFBLENBQ00sRUFBTixJQUFBO0NBTEYsT0FBQTtDQUFBLEVBT0EsQ0FBQyxFQUFELEVBQU87Q0FQUCxFQVFvQixDQUFuQixFQUFELEdBQVUsWUFBVTtDQVJwQixFQVNrQixDQUFqQixFQUFELEdBQVUsVUFBUTtDQVRsQixFQVVVLENBQVQsRUFBRCxLQUFVO0NBVlYsQ0FhMkIsQ0FBM0IsQ0FBQyxFQUFELEVBQVcsR0FBa0YsSUFBbEUsQ0FBNEI7Q0FidkQsQ0FjQSxDQUFJLENBQUgsRUFBRCxHQUFvQjtDQUNsQixFQUFB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L0JULElBMkJPOztDQTNCUDs7Q0FERjtDQUFBOzs7OztBQ0FFO0NBQUEsS0FBQTtLQUFBOzs7MEpBQUE7O0NBQUEsQ0FBQSxDQUF1QixHQUFqQixDQUFOO0NBRUU7O0NBQWEsRUFBQSxDQUFBLFlBQUM7Q0FDWixnREFBQTtDQUFBLEdBQUEsRUFBQSxrQ0FBTTtDQUFOLENBQ3lDLEVBQTlCLENBQU0sQ0FBakIsS0FBQSxLQUFBO0NBRkYsSUFBYTs7Q0FBYixFQUlPLEVBQVAsSUFBTztDQUNMLEdBQVEsQ0FBSyxHQUFOLEtBQUE7Q0FMVCxJQUlPOztDQUpQLEVBT2EsSUFBQSxFQUFDLEVBQWQ7Q0FDRSxHQUFBLE1BQUE7QUFBSSxDQUFKLENBQXNCLENBQUEsQ0FBbkIsQ0FBbUIsQ0FBdEIsQ0FBVyxRQUF1QjtDQUMvQixHQUFBLE1BQUQsS0FBQTtNQURGLEVBQUE7Q0FHRyxHQUFBLENBQUQsS0FBQSxLQUFBO1FBSlM7Q0FQYixJQU9hOztDQVBiOztDQUZvQyxHQUFXLEVBQUw7Q0FBNUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIkdtYXAgPSByZXF1aXJlKCcuL0dtYXAuY29mZmVlJylcblNlYXJjaCA9IHJlcXVpcmUoJy4vU2VhcmNoLmNvZmZlZScpXG5Qb3BpbiA9IHJlcXVpcmUoJy4vUG9waW4uY29mZmVlJylcbk1hcmtlciA9IHVuZGVmaW5lZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEx1bnJHbWFwXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdG9yKSAtPlxuICAgIEBsb2FkZXIgPVxuICAgICAgbWFwOiBmYWxzZVxuICAgICAgZmVlZDogZmFsc2VcbiAgICBAdGVtcGxhdGVzID1cbiAgICAgIHNpbmdsZTogXCJcIlxuICAgICAgbGlzdDogXCJcIlxuXG4gICAgQCRlbCA9ICQoQHNlbGVjdG9yKVxuICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlU2luZ2xlJylcbiAgICBAdGVtcGxhdGVzLmxpc3QgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVMaXN0JylcbiAgICBAZmllbGRzID0gQHBhcnNlRmllbGRzKEAkZWwuYXR0cignZGF0YS1sdW5yJykpXG5cbiAgICAjIEluaXQgR21hcFxuICAgIEBtYXAgPSBuZXcgR21hcChAc2VsZWN0b3IsIEAkZWwuYXR0cignZGF0YS1sYXRpdHVkZScpLCBAJGVsLmF0dHIoJ2RhdGEtbG9uZ2l0dWRlJyksIHBhcnNlSW50KEAkZWwuYXR0cignZGF0YS16b29tJykpKVxuICAgIEBtYXAuJGVsLm9uIFwibG9hZFwiLCA9PlxuICAgICAgQGxvYWRlci5tYXAgPSB0cnVlXG4gICAgICBNYXJrZXIgPSByZXF1aXJlKCcuL01hcmtlci5jb2ZmZWUnKVxuICAgICAgaWYgQGxvYWRlci5mZWVkXG4gICAgICAgIEBhZGRNYXJrZXJzKEBmZWVkKVxuXG4gICAgIyBJbml0IGZlZWRcbiAgICAkLmdldChAJGVsLmF0dHIoJ2RhdGEtZmVlZCcpKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEBmZWVkID0gZGF0YVxuICAgICAgICBAbG9hZGVyLmZlZWQgPSB0cnVlXG4gICAgICAgIGlmIEBsb2FkZXIubWFwXG4gICAgICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG4gICAgICAgICMgSW5pdCBzZWFyY2hcbiAgICAgICAgQHNlYXJjaCA9IG5ldyBTZWFyY2goQHNlbGVjdG9yLCBAZmVlZCwgQGZpZWxkcylcbiAgICAgICAgQHNlYXJjaC4kZWwub24gXCJzZWFyY2guY2hhbmdlXCIsIChlLCBkYXRhKSA9PlxuICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIgQG1hcC5nbWFwLCBcInNlYXJjaC5jaGFuZ2VkXCIsIGRhdGEucmVmc1xuXG4gICAgIyBJbml0IFBvcGluXG4gICAgQHBvcGluID0gbmV3IFBvcGluKEBzZWxlY3RvcilcblxuICAgICMgSW5pdCBUZW1wbGF0ZXNcbiAgICAkLmdldChAdGVtcGxhdGVzLnNpbmdsZSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGVzLnNpbmdsZSA9IF8udGVtcGxhdGUoZGF0YSlcblxuICAgICQuZ2V0KEB0ZW1wbGF0ZXMubGlzdClcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAdGVtcGxhdGVzLmxpc3QgPSBfLnRlbXBsYXRlKGRhdGEpXG5cbiAgYWRkTWFya2VyczogKGRhdGEpIC0+XG4gICAgQG1hcmtlcnMgPSBuZXcgQXJyYXlcbiAgICBmb3IgbWFya2VyIGluIGRhdGFcbiAgICAgIEBhZGRNYXJrZXIobWFya2VyKVxuXG4gICAgcmV0dXJuIEBcblxuICBhZGRNYXJrZXI6IChkYXRhKS0+XG4gICAgZGF0YS5wb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoZGF0YS5sYXRpdHVkZSxkYXRhLmxvbmdpdHVkZSlcbiAgICBkYXRhLm1hcCA9IEBtYXAuZ21hcFxuICAgIG1hcmtlciA9IG5ldyBNYXJrZXIoZGF0YSlcblxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgbWFya2VyLCAnY2xpY2snLCAoKSA9PlxuICAgICAgQGRpc3BsYXlTaW5nbGUobWFya2VyKVxuICAgIHJldHVybiBAXG5cbiAgZGlzcGxheVNpbmdsZTogKG1hcmtlcikgLT5cbiAgICBAcG9waW4uc2V0Q29udGVudChAdGVtcGxhdGVzLnNpbmdsZShtYXJrZXIpKVxuICAgIHJldHVybiBAXG5cbiAgcGFyc2VGaWVsZHM6IChkYXRhKSAtPlxuICAgIGZpZWxkcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIGZpZWxkIGluIGRhdGEuc3BsaXQoJywnKVxuICAgICAgZmllbGQgPSBmaWVsZC5zcGxpdCgnfCcpXG4gICAgICBmaWVsZHMucHVzaChbZmllbGRbMF0sIHBhcnNlSW50KGZpZWxkWzFdKV0pXG4gICAgcmV0dXJuIGZpZWxkc1xuXG53aW5kb3cuTHVuckdtYXAgPSBMdW5yR21hcFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBHbWFwXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBAbGF0aXR1ZGUsIEBsb25naXR1ZGUsIEB6b29tKSAtPlxuICAgIEBpZCA9ICdtYXAtY2FudmFzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtY2FudmFzXCIgLz4nKVxuICAgIEAkZWwgPSAkKCcjJytAaWQpXG5cbiAgICBAem9vbSA9IDEgdW5sZXNzIEB6b29tXG4gICAgQGxvYWRHb29nbGVNYXBzKClcbiAgICAjIEAkZWwgPSAkKCcuZmlsdGVycycpXG4gICAgIyBAJGZpbHRlcnMgPSBAJGVsLmZpbmQoJy5maWx0ZXInKVxuICAgICMgQHNldEZpbHRlcihcImFsbFwiKVxuICAgICMgQCRmaWx0ZXJzLm9uIFwiY2xpY2tcIiwgQHNldEZpbHRlclxuXG4gICAgIyBAcmVuZGVyKClcbiAgICByZXR1cm4gQFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICByZXR1cm4gQFxuXG4gICMgZ2V0RmlsdGVyOiAoKSAtPlxuICAjICAgcmV0dXJuIEBmaWx0ZXJcbiAgI1xuICAjIHNldEZpbHRlcjogKGZpbHRlcikgPT5cbiAgIyAgIGlmIGZpbHRlciBpbnN0YW5jZW9mIGpRdWVyeS5FdmVudFxuICAjICAgICBmaWx0ZXIucHJldmVudERlZmF1bHQoKVxuICAjICAgICBmaWx0ZXIgPSAkKGZpbHRlci50YXJnZXQpLmNsb3Nlc3QoJ2EnKS5hdHRyKCdkYXRhLWZpbHRlcicpXG4gICNcbiAgIyAgIGlmIChmaWx0ZXIgPT0gXCJhbGxcIiB8fCBmaWx0ZXIgPT0gQGdldEZpbHRlcigpLmpvaW4oKSlcbiAgIyAgICAgQGZpbHRlciA9IG5ldyBBcnJheShcIjFcIiwgXCIyXCIsIFwiM1wiLCBcIjRcIiwgXCI1XCIpXG4gICMgICAgIEAkZmlsdGVycy5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAjICAgZWxzZVxuICAjICAgICBAJGZpbHRlcnMubm90KCQoZmlsdGVyLnRhcmdldCkuY2xvc2VzdCgnYScpKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAjICAgICAkKCdbZGF0YS1maWx0ZXI9XCInK2ZpbHRlcisnXCJdJykuYWRkQ2xhc3MoXCJhY3RpdmVcIilcbiAgIyAgICAgQGZpbHRlciA9IG5ldyBBcnJheShmaWx0ZXIpXG4gICNcbiAgIyAgIGdvb2dsZT8ubWFwcy5ldmVudC50cmlnZ2VyKGluX21hcF94bWwubWFwLCAnZmlsdGVyX2NoYW5nZWQnKVxuICAjXG4gICMgICByZXR1cm4gQFxuXG4gIGxvYWRHb29nbGVNYXBzOiAoKSAtPlxuICAgICQuZ2V0U2NyaXB0ICdodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpJywgPT5cbiAgICAgIGdvb2dsZS5sb2FkICdtYXBzJywgJzMnLFxuICAgICAgICBvdGhlcl9wYXJhbXM6ICdzZW5zb3I9ZmFsc2UnXG4gICAgICAgIGNhbGxiYWNrOiBAY3JlYXRlXG4gICAgICAgIGxpYnJhcmllczogXCJnZW9tZXRyeVwiXG4gICAgcmV0dXJuIEBcblxuICBjcmVhdGU6ICgpID0+XG4gICAgc3R5bGVzID0gW1xuICAgICAgZmVhdHVyZVR5cGU6IFwicG9pXCJcbiAgICAgIGVsZW1lbnRUeXBlOiBcImxhYmVsc1wiXG4gICAgICBzdHlsZXJzOiBbXG4gICAgICAgIHZpc2liaWxpdHk6IFwib2ZmXCJcbiAgICAgIF1cbiAgICBdXG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGdvb2dsZSBtYXBcbiAgICBAZ21hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoQGlkKSxcbiAgICAgIHpvb206IEB6b29tLFxuICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKEBsYXRpdHVkZSxAbG9uZ2l0dWRlKVxuICAgICAgdmlzdWFsUmVmcmVzaDogdHJ1ZVxuICAgICAgZGlzYWJsZURlZmF1bHRVSTogdHJ1ZVxuICAgICAgc3R5bGVzOiBzdHlsZXNcbiAgICBAJGVsLnRyaWdnZXIoXCJsb2FkXCIpXG5cbiAgICByZXR1cm4gQFxuXG4gICMgZGlzcGxheVNpbmdsZTogKGRhdGEpIC0+XG4gICMgICBjb250ZW50ID0gXy50ZW1wbGF0ZSBAdGVtcGxhdGVTaW5nbGUsIGRhdGFcbiAgIyAgIEBwb3Bpbi5zZXRDb250ZW50KGNvbnRlbnQpXG4gICMgICBAcG9waW4uc2hvdygpXG4gICNcbiAgIyAgIHJldHVybiBAXG4gICNcbiAgIyBkaXNwbGF5TGlzdDogKHJlc3VsdHMpIC0+XG4gICMgICBjb250ZW50ID0gXCJcIlxuICAjICAgZm9yIGlkIGluIHJlc3VsdHNcbiAgIyAgICAgY29udGVudCArPSBfLnRlbXBsYXRlIEB0ZW1wbGF0ZUxpc3QsIEBwbGFjZXNbaWRdXG4gICNcbiAgIyAgIEBwb3Bpbi5zZXRDb250ZW50KGNvbnRlbnQpXG4gICMgICBAcG9waW4uc2hvdygpXG4gICMgICBAcG9waW4uYmluZExpc3QoKVxuICAjXG4gICMgICByZXR1cm4gQFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZWFyY2hcblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCwgZGF0YSwgZmllbGRzLCBzY29yZSkgLT5cbiAgICBAJGVsID0gJCgnPGRpdiBjbGFzcz1cIm1hcC1zZWFyY2hcIiAvPicpXG4gICAgJChwYXJlbnQpLmFwcGVuZChAJGVsKVxuICAgIEAkaW5wdXQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiAvPicpXG4gICAgQCRlbC5hcHBlbmQoQCRpbnB1dClcblxuICAgIEByZWZzID0gQHJlc3VsdHMgPSBuZXcgQXJyYXkoKVxuICAgIEBzY29yZSA9IDAgdW5sZXNzIHNjb3JlXG4gICAgQGluZGV4ID0gbHVuciAtPlxuICAgICAgZm9yIGZpZWxkIGluIGZpZWxkc1xuICAgICAgICB0aGlzLmZpZWxkKGZpZWxkWzBdLCBmaWVsZFsxXSlcbiAgICAgICAgdGhpcy5yZWYoJ2luZGV4JylcblxuICAgIEAkaW5wdXQub24gXCJrZXl1cFwiLCBAaW5pdFNlYXJjaFxuXG4gICAgaWYgZGF0YT9cbiAgICAgIGZvciBpdGVtIGluIGRhdGFcbiAgICAgICAgQGluZGV4LmFkZChpdGVtKVxuXG4gICAgQCRlbC50cmlnZ2VyKCdyZWFkeScpXG4gICAgcmV0dXJuIEBcblxuICBpbml0U2VhcmNoOiAoKSA9PlxuICAgIEBmaWx0ZXIoKVxuICAgIEAkZWwudHJpZ2dlcignc2VhcmNoLmNoYW5nZScsIHtAcmVmc30pXG5cbiAgICByZXR1cm4gQFxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmV0dXJuIEByZXN1bHRzXG5cbiAgZ2V0UmVmczogKCkgLT5cbiAgICByZXR1cm4gQHJlZnNcblxuICBmaWx0ZXI6IC0+XG4gICAgQHJlc3VsdHMgPSBAaW5kZXguc2VhcmNoKEBnZXRGaWx0ZXIoKSlcbiAgICBAcmVmcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIHJlc3VsdCBpbiBAcmVzdWx0c1xuICAgICAgaWYgcmVzdWx0LnNjb3JlID49IEBzY29yZVxuICAgICAgICBAcmVmcy5wdXNoKHJlc3VsdC5yZWYpXG4gICAgcmV0dXJuIEBcblxuICBjbGVhcjogLT5cbiAgICBAJGlucHV0LnZhbChcIlwiKVxuICAgIEBmaWx0ZXIoKVxuXG4gIGdldEZpbHRlcjogLT5cbiAgICByZXR1cm4gQCRpbnB1dC52YWwoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQb3BpblxuICBjb25zdHJ1Y3RvcjogKHBhcmVudCkgLT5cbiAgICBAaWQgPSAncG9waW4tY29udGVudC0nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSlcbiAgICBAJHBhcmVudCA9ICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJwb3Bpbi1jb250ZW50XCIgLz4nKVxuICAgIEAkZWwgPSBAJHBhcmVudC5maW5kKCcucG9waW4tY29udGVudCcpXG4gICAgQCRjbG9zZUJ0biA9IEAkcGFyZW50LmZpbmQoJy5jbG9zZScpXG4gICAgQCRjbG9zZUJ0bi5vbiBcImNsaWNrXCIsIEBjbG9zZVxuXG4gICAgcmV0dXJuIEBcblxuICBzZXRDb250ZW50OiAoY29udGVudCkgLT5cbiAgICBAJGVsLmh0bWwoY29udGVudClcblxuICAgIHJldHVybiBAXG5cbiAgYmluZExpc3Q6ICgpID0+XG4gICAgQCRwYXJlbnQuYWRkQ2xhc3MoJ3NlYXJjaC1saXN0JylcbiAgICBAJHBhcmVudC5maW5kKCcuc2VhcmNoLWl0ZW0nKS5vZmYgXCJjbGlja1wiXG5cbiAgICBAJHBhcmVudC5maW5kKCcuc2VhcmNoLWl0ZW0nKS5vbiBcImNsaWNrXCIsIChlKSA9PlxuICAgICAgcGxhY2UgPSBALnBsYWNlc1skKGUudGFnZXQpLmNsb3Nlc3QoJy5zZWFyY2gtaXRlbScpLmF0dHIoJ2RhdGEtaWQnKV1cbiAgICAgIEAuZGlzcGxheVNpbmdsZShwbGFjZSlcblxuICBzaG93OiAoKSA9PlxuICAgIEAkcGFyZW50LmFkZENsYXNzKFwib3BlblwiKVxuICAgIEAkcGFyZW50LnRyaWdnZXIoXCJvcGVuXCIpXG4gICAgcmV0dXJuIEBcblxuICBjbG9zZTogKCkgPT5cbiAgICBAJHBhcmVudC50cmlnZ2VyKFwiY2xvc2VcIilcbiAgICBAJHBhcmVudC5yZW1vdmVDbGFzcyhcIm9wZW5cIilcblxuICAgIHJldHVybiBAXG4iLCIgIG1vZHVsZS5leHBvcnRzID0gY2xhc3MgTWFya2VyIGV4dGVuZHMgZ29vZ2xlLm1hcHMuTWFya2VyXG4gICAgIyBleHRlbmQgdGhlIGdvb2dsZS5tYXBzLk1hcmtlciBvYmplY3QgdG8gbWFuYWdlIGZpbHRlcnNcbiAgICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgICBzdXBlciBhcmdzXG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBAZ2V0TWFwKCksICdzZWFyY2guY2hhbmdlZCcsIEBjaGVja1NlYXJjaFxuXG4gICAgZ2V0SWQ6ICgpIC0+XG4gICAgICByZXR1cm4gQGluZGV4LnRvU3RyaW5nKClcblxuICAgIGNoZWNrU2VhcmNoOiAocmVzdWx0cykgPT5cbiAgICAgIGlmICFyZXN1bHRzLmxlbmd0aCB8fCBAZ2V0SWQoKSBpbiByZXN1bHRzXG4gICAgICAgIEBzZXRWaXNpYmxlKHRydWUpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRWaXNpYmxlKGZhbHNlKVxuIl19
;