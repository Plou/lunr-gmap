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
      this.initGmap();
      this.popin = new Popin(this.selector);
      $.get(this.$el.attr('data-feed')).done(function(data) {
        _this.feed = data;
        return _this.initFeed();
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
        return google.maps.event.trigger(_this.map.gmap, "search.changed", data.refs);
      });
      return this;
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9NYXJrZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtDQUFBLEtBQUEsK0JBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxRQUFBOztDQUFQLENBQ0EsQ0FBUyxHQUFULENBQVMsVUFBQTs7Q0FEVCxDQUVBLENBQVEsRUFBUixFQUFRLFNBQUE7O0NBRlIsQ0FHQSxDQUFTLEdBQVQ7O0NBSEEsQ0FLQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsRUFBQSxDQUFBLElBQUEsVUFBRTtDQUNiLFNBQUEsRUFBQTtDQUFBLEVBRGEsQ0FBQSxFQUFELEVBQ1o7Q0FBQSxFQUNFLENBREQsRUFBRDtDQUNFLENBQUssQ0FBTCxFQUFBLEdBQUE7Q0FBQSxDQUNNLEVBQU4sQ0FEQSxHQUNBO0NBRkYsT0FBQTtDQUFBLEVBSUUsQ0FERCxFQUFELEdBQUE7Q0FDRSxDQUFRLElBQVIsRUFBQTtDQUFBLENBQ00sRUFBTixJQUFBO0NBTEYsT0FBQTtDQUFBLEVBT0EsQ0FBQyxFQUFELEVBQU87Q0FQUCxFQVFvQixDQUFuQixFQUFELEdBQVUsWUFBVTtDQVJwQixFQVNrQixDQUFqQixFQUFELEdBQVUsVUFBUTtDQVRsQixFQVVVLENBQVQsRUFBRCxLQUFVO0NBVlYsR0FZQyxFQUFELEVBQUE7Q0FaQSxFQWVhLENBQVosQ0FBRCxDQUFBLEVBQWE7Q0FmYixFQWtCQSxDQUFPLEVBQVAsR0FDUyxFQURIO0NBRUYsRUFBUSxD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TztDQXpCVCxJQXNCTTs7Q0F0Qk4sRUEyQk8sRUFBUCxJQUFPO0NBQ0wsR0FBQyxFQUFELENBQVE7Q0FBUixHQUNDLEVBQUQsQ0FBUSxJQUFSO0NBRUEsR0FBQSxTQUFPO0NBL0JULElBMkJPOztDQTNCUDs7Q0FERjtDQUFBOzs7OztBQ0FFO0NBQUEsS0FBQTtLQUFBOzs7MEpBQUE7O0NBQUEsQ0FBQSxDQUF1QixHQUFqQixDQUFOO0NBRUU7O0NBQWEsRUFBQSxDQUFBLFlBQUM7Q0FDWixnREFBQTtDQUFBLEdBQUEsRUFBQSxrQ0FBTTtDQUFOLENBQ3lDLEVBQTlCLENBQU0sQ0FBakIsS0FBQSxLQUFBO0NBRkYsSUFBYTs7Q0FBYixFQUlPLEVBQVAsSUFBTztDQUNMLEdBQVEsQ0FBSyxHQUFOLEtBQUE7Q0FMVCxJQUlPOztDQUpQLEVBT2EsSUFBQSxFQUFDLEVBQWQ7Q0FDRSxHQUFBLE1BQUE7QUFBSSxDQUFKLENBQXNCLENBQUEsQ0FBbkIsQ0FBbUIsQ0FBdEIsQ0FBVyxRQUF1QjtDQUMvQixHQUFBLE1BQUQsS0FBQTtNQURGLEVBQUE7Q0FHRyxHQUFBLENBQUQsS0FBQSxLQUFBO1FBSlM7Q0FQYixJQU9hOztDQVBiOztDQUZvQyxHQUFXLEVBQUw7Q0FBNUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIkdtYXAgPSByZXF1aXJlKCcuL0dtYXAuY29mZmVlJylcblNlYXJjaCA9IHJlcXVpcmUoJy4vU2VhcmNoLmNvZmZlZScpXG5Qb3BpbiA9IHJlcXVpcmUoJy4vUG9waW4uY29mZmVlJylcbk1hcmtlciA9IHVuZGVmaW5lZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEx1bnJHbWFwXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdG9yKSAtPlxuICAgIEBsb2FkZXIgPVxuICAgICAgbWFwOiBmYWxzZVxuICAgICAgZmVlZDogZmFsc2VcbiAgICBAdGVtcGxhdGVzID1cbiAgICAgIHNpbmdsZTogXCJcIlxuICAgICAgbGlzdDogXCJcIlxuXG4gICAgQCRlbCA9ICQoQHNlbGVjdG9yKVxuICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gQCRlbC5hdHRyKCdkYXRhLXRlbXBsYXRlU2luZ2xlJylcbiAgICBAdGVtcGxhdGVzLmxpc3QgPSBAJGVsLmF0dHIoJ2RhdGEtdGVtcGxhdGVMaXN0JylcbiAgICBAZmllbGRzID0gQHBhcnNlRmllbGRzKEAkZWwuYXR0cignZGF0YS1sdW5yJykpXG5cbiAgICBAaW5pdEdtYXAoKVxuXG4gICAgIyBJbml0IFBvcGluXG4gICAgQHBvcGluID0gbmV3IFBvcGluKEBzZWxlY3RvcilcblxuICAgICMgR2V0IHRoZSBmZWVkXG4gICAgJC5nZXQoQCRlbC5hdHRyKCdkYXRhLWZlZWQnKSlcbiAgICAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgICBAZmVlZCA9IGRhdGFcbiAgICAgICAgQGluaXRGZWVkKClcblxuICAgICMgR2V0IHRlbXBsYXRlc1xuICAgICQuZ2V0KEB0ZW1wbGF0ZXMuc2luZ2xlKVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZXMuc2luZ2xlID0gXy50ZW1wbGF0ZShkYXRhKVxuXG4gICAgJC5nZXQoQHRlbXBsYXRlcy5saXN0KVxuICAgICAgLmRvbmUgKGRhdGEpID0+XG4gICAgICAgIEB0ZW1wbGF0ZXMubGlzdCA9IF8udGVtcGxhdGUoZGF0YSlcblxuICBpbml0R21hcDogLT5cbiAgICBAbWFwID0gbmV3IEdtYXAoQHNlbGVjdG9yLCBAJGVsLmF0dHIoJ2RhdGEtbGF0aXR1ZGUnKSwgQCRlbC5hdHRyKCdkYXRhLWxvbmdpdHVkZScpLCBwYXJzZUludChAJGVsLmF0dHIoJ2RhdGEtem9vbScpKSlcbiAgICBAbWFwLiRlbC5vbiBcImxvYWRcIiwgPT5cbiAgICAgIEBsb2FkZXIubWFwID0gdHJ1ZVxuICAgICAgTWFya2VyID0gcmVxdWlyZSgnLi9NYXJrZXIuY29mZmVlJylcbiAgICAgIGlmIEBsb2FkZXIuZmVlZFxuICAgICAgICBAYWRkTWFya2VycyhAZmVlZClcbiAgICByZXR1cm4gQFxuXG4gIGluaXRGZWVkOiAoKS0+XG4gICAgQGxvYWRlci5mZWVkID0gdHJ1ZVxuICAgIGlmIEBsb2FkZXIubWFwXG4gICAgICBAYWRkTWFya2VycyhAZmVlZClcbiAgICAjIEluaXQgc2VhcmNoXG4gICAgQHNlYXJjaCA9IG5ldyBTZWFyY2goQHNlbGVjdG9yLCBAZmVlZCwgQGZpZWxkcylcbiAgICBAc2VhcmNoLiRlbC5vbiBcInNlYXJjaC5jaGFuZ2VcIiwgKGUsIGRhdGEpID0+XG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyIEBtYXAuZ21hcCwgXCJzZWFyY2guY2hhbmdlZFwiLCBkYXRhLnJlZnNcbiAgICByZXR1cm4gQFxuXG4gIGFkZE1hcmtlcnM6IChkYXRhKSAtPlxuICAgIEBtYXJrZXJzID0gbmV3IEFycmF5XG4gICAgZm9yIG1hcmtlciBpbiBkYXRhXG4gICAgICBAYWRkTWFya2VyKG1hcmtlcilcbiAgICByZXR1cm4gQFxuXG4gIGFkZE1hcmtlcjogKGRhdGEpLT5cbiAgICBkYXRhLnBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhkYXRhLmxhdGl0dWRlLGRhdGEubG9uZ2l0dWRlKVxuICAgIGRhdGEubWFwID0gQG1hcC5nbWFwXG4gICAgbWFya2VyID0gbmV3IE1hcmtlcihkYXRhKVxuXG4gICAgQG1hcmtlcnMucHVzaChtYXJrZXIpXG5cbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lciBtYXJrZXIsICdjbGljaycsICgpID0+XG4gICAgICBAZGlzcGxheVNpbmdsZShtYXJrZXIpXG4gICAgcmV0dXJuIEBcblxuICBkaXNwbGF5U2luZ2xlOiAobWFya2VyKSAtPlxuICAgIEBwb3Bpbi5zZXRDb250ZW50KEB0ZW1wbGF0ZXMuc2luZ2xlKG1hcmtlcikpXG4gICAgcmV0dXJuIEBcblxuICBwYXJzZUZpZWxkczogKGRhdGEpIC0+XG4gICAgZmllbGRzID0gbmV3IEFycmF5KClcbiAgICBmb3IgZmllbGQgaW4gZGF0YS5zcGxpdCgnLCcpXG4gICAgICBmaWVsZCA9IGZpZWxkLnNwbGl0KCd8JylcbiAgICAgIGZpZWxkcy5wdXNoKFtmaWVsZFswXSwgcGFyc2VJbnQoZmllbGRbMV0pXSlcbiAgICByZXR1cm4gZmllbGRzXG5cbiMgRXhwb3J0IHRoZSBjbGFzcyB0byB0aGUgZ2xvYmFsIHNjb3BlXG53aW5kb3cuTHVuckdtYXAgPSBMdW5yR21hcFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBHbWFwXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBAbGF0aXR1ZGUsIEBsb25naXR1ZGUsIEB6b29tKSAtPlxuICAgIEBpZCA9ICdtYXAtY2FudmFzLScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgICQocGFyZW50KS5hcHBlbmQoJzxkaXYgaWQ9XCInK0BpZCsnXCIgY2xhc3M9XCJtYXAtY2FudmFzXCIgLz4nKVxuICAgIEAkZWwgPSAkKCcjJytAaWQpXG5cbiAgICBAem9vbSA9IDQgdW5sZXNzIEB6b29tXG4gICAgQGxvYWRHb29nbGVNYXBzKClcbiAgICAjIEAkZWwgPSAkKCcuZmlsdGVycycpXG4gICAgIyBAJGZpbHRlcnMgPSBAJGVsLmZpbmQoJy5maWx0ZXInKVxuICAgICMgQHNldEZpbHRlcihcImFsbFwiKVxuICAgICMgQCRmaWx0ZXJzLm9uIFwiY2xpY2tcIiwgQHNldEZpbHRlclxuXG4gICAgcmV0dXJuIEBcblxuICAjIGdldEZpbHRlcjogKCkgLT5cbiAgIyAgIHJldHVybiBAZmlsdGVyXG4gICNcbiAgIyBzZXRGaWx0ZXI6IChmaWx0ZXIpID0+XG4gICMgICBpZiBmaWx0ZXIgaW5zdGFuY2VvZiBqUXVlcnkuRXZlbnRcbiAgIyAgICAgZmlsdGVyLnByZXZlbnREZWZhdWx0KClcbiAgIyAgICAgZmlsdGVyID0gJChmaWx0ZXIudGFyZ2V0KS5jbG9zZXN0KCdhJykuYXR0cignZGF0YS1maWx0ZXInKVxuICAjXG4gICMgICBpZiAoZmlsdGVyID09IFwiYWxsXCIgfHwgZmlsdGVyID09IEBnZXRGaWx0ZXIoKS5qb2luKCkpXG4gICMgICAgIEBmaWx0ZXIgPSBuZXcgQXJyYXkoXCIxXCIsIFwiMlwiLCBcIjNcIiwgXCI0XCIsIFwiNVwiKVxuICAjICAgICBAJGZpbHRlcnMucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgIyAgIGVsc2VcbiAgIyAgICAgQCRmaWx0ZXJzLm5vdCgkKGZpbHRlci50YXJnZXQpLmNsb3Nlc3QoJ2EnKSkucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgIyAgICAgJCgnW2RhdGEtZmlsdGVyPVwiJytmaWx0ZXIrJ1wiXScpLmFkZENsYXNzKFwiYWN0aXZlXCIpXG4gICMgICAgIEBmaWx0ZXIgPSBuZXcgQXJyYXkoZmlsdGVyKVxuICAjXG4gICMgICBnb29nbGU/Lm1hcHMuZXZlbnQudHJpZ2dlcihpbl9tYXBfeG1sLm1hcCwgJ2ZpbHRlcl9jaGFuZ2VkJylcbiAgI1xuICAjICAgcmV0dXJuIEBcblxuICBsb2FkR29vZ2xlTWFwczogKCkgLT5cbiAgICAkLmdldFNjcmlwdCAnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaScsID0+XG4gICAgICBnb29nbGUubG9hZCAnbWFwcycsICczJyxcbiAgICAgICAgb3RoZXJfcGFyYW1zOiAnc2Vuc29yPWZhbHNlJ1xuICAgICAgICBjYWxsYmFjazogQGNyZWF0ZVxuICAgICAgICBsaWJyYXJpZXM6IFwiZ2VvbWV0cnlcIlxuICAgIHJldHVybiBAXG5cbiAgY3JlYXRlOiAoKSA9PlxuICAgICMgT3B0aW9uc1xuICAgIHN0eWxlcyA9IFtcbiAgICAgIGZlYXR1cmVUeXBlOiBcInBvaVwiXG4gICAgICBlbGVtZW50VHlwZTogXCJsYWJlbHNcIlxuICAgICAgc3R5bGVyczogW1xuICAgICAgICB2aXNpYmlsaXR5OiBcIm9mZlwiXG4gICAgICBdXG4gICAgXVxuXG4gICAgIyBJbml0aWFsaXplIHRoZSBnb29nbGUgbWFwXG4gICAgQGdtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKEBpZCksXG4gICAgICB6b29tOiBAem9vbSxcbiAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhAbGF0aXR1ZGUsQGxvbmdpdHVkZSlcbiAgICAgIHZpc3VhbFJlZnJlc2g6IHRydWVcbiAgICAgIGRpc2FibGVEZWZhdWx0VUk6IHRydWVcbiAgICAgIHN0eWxlczogc3R5bGVzXG4gICAgQCRlbC50cmlnZ2VyKFwibG9hZFwiKVxuICAgIHJldHVybiBAXG5cbiAgIyBkaXNwbGF5U2luZ2xlOiAoZGF0YSkgLT5cbiAgIyAgIGNvbnRlbnQgPSBfLnRlbXBsYXRlIEB0ZW1wbGF0ZVNpbmdsZSwgZGF0YVxuICAjICAgQHBvcGluLnNldENvbnRlbnQoY29udGVudClcbiAgIyAgIEBwb3Bpbi5zaG93KClcbiAgI1xuICAjICAgcmV0dXJuIEBcbiAgI1xuICAjIGRpc3BsYXlMaXN0OiAocmVzdWx0cykgLT5cbiAgIyAgIGNvbnRlbnQgPSBcIlwiXG4gICMgICBmb3IgaWQgaW4gcmVzdWx0c1xuICAjICAgICBjb250ZW50ICs9IF8udGVtcGxhdGUgQHRlbXBsYXRlTGlzdCwgQHBsYWNlc1tpZF1cbiAgI1xuICAjICAgQHBvcGluLnNldENvbnRlbnQoY29udGVudClcbiAgIyAgIEBwb3Bpbi5zaG93KClcbiAgIyAgIEBwb3Bpbi5iaW5kTGlzdCgpXG4gICNcbiAgIyAgIHJldHVybiBAXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlYXJjaFxuXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50LCBkYXRhLCBmaWVsZHMsIHNjb3JlKSAtPlxuICAgIEAkZWwgPSAkKCc8ZGl2IGNsYXNzPVwibWFwLXNlYXJjaFwiIC8+JylcbiAgICAkKHBhcmVudCkuYXBwZW5kKEAkZWwpXG4gICAgQCRpbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIC8+JylcbiAgICBAJGVsLmFwcGVuZChAJGlucHV0KVxuXG4gICAgQHJlZnMgPSBAcmVzdWx0cyA9IG5ldyBBcnJheSgpXG4gICAgQHNjb3JlID0gMCB1bmxlc3Mgc2NvcmVcbiAgICBAaW5kZXggPSBsdW5yIC0+XG4gICAgICBmb3IgZmllbGQgaW4gZmllbGRzXG4gICAgICAgIHRoaXMuZmllbGQoZmllbGRbMF0sIGZpZWxkWzFdKVxuICAgICAgICB0aGlzLnJlZignaW5kZXgnKVxuXG4gICAgQCRpbnB1dC5vbiBcImtleXVwXCIsIEBpbml0U2VhcmNoXG5cbiAgICBpZiBkYXRhP1xuICAgICAgZm9yIGl0ZW0gaW4gZGF0YVxuICAgICAgICBAaW5kZXguYWRkKGl0ZW0pXG5cbiAgICBAJGVsLnRyaWdnZXIoJ3JlYWR5JylcbiAgICByZXR1cm4gQFxuXG4gIGluaXRTZWFyY2g6ICgpID0+XG4gICAgQGZpbHRlcigpXG4gICAgQCRlbC50cmlnZ2VyKCdzZWFyY2guY2hhbmdlJywge0ByZWZzfSlcbiAgICByZXR1cm4gQFxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmV0dXJuIEByZXN1bHRzXG5cbiAgZ2V0UmVmczogKCkgLT5cbiAgICByZXR1cm4gQHJlZnNcblxuICBmaWx0ZXI6IC0+XG4gICAgQHJlc3VsdHMgPSBAaW5kZXguc2VhcmNoKEBnZXRGaWx0ZXIoKSlcbiAgICBAcmVmcyA9IG5ldyBBcnJheSgpXG4gICAgZm9yIHJlc3VsdCBpbiBAcmVzdWx0c1xuICAgICAgaWYgcmVzdWx0LnNjb3JlID49IEBzY29yZVxuICAgICAgICBAcmVmcy5wdXNoKHJlc3VsdC5yZWYpXG4gICAgcmV0dXJuIEBcblxuICBjbGVhcjogLT5cbiAgICBAJGlucHV0LnZhbChcIlwiKVxuICAgIEBmaWx0ZXIoKVxuICAgIHJldHVybiBAXG5cbiAgZ2V0RmlsdGVyOiAtPlxuICAgIHJldHVybiBAJGlucHV0LnZhbCgpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBvcGluXG4gIGNvbnN0cnVjdG9yOiAocGFyZW50KSAtPlxuICAgIEBpZCA9ICdwb3Bpbi1jb250ZW50LScrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKVxuICAgIEAkcGFyZW50ID0gJChwYXJlbnQpLmFwcGVuZCgnPGRpdiBpZD1cIicrQGlkKydcIiBjbGFzcz1cInBvcGluLWNvbnRlbnRcIiAvPicpXG4gICAgQCRlbCA9IEAkcGFyZW50LmZpbmQoJy5wb3Bpbi1jb250ZW50JylcbiAgICBAJGNsb3NlQnRuID0gQCRwYXJlbnQuZmluZCgnLmNsb3NlJylcbiAgICBAJGNsb3NlQnRuLm9uIFwiY2xpY2tcIiwgQGNsb3NlXG5cbiAgICByZXR1cm4gQFxuXG4gIHNldENvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIEAkZWwuaHRtbChjb250ZW50KVxuXG4gICAgcmV0dXJuIEBcblxuICBiaW5kTGlzdDogKCkgPT5cbiAgICBAJHBhcmVudC5hZGRDbGFzcygnc2VhcmNoLWxpc3QnKVxuICAgIEAkcGFyZW50LmZpbmQoJy5zZWFyY2gtaXRlbScpLm9mZiBcImNsaWNrXCJcblxuICAgIEAkcGFyZW50LmZpbmQoJy5zZWFyY2gtaXRlbScpLm9uIFwiY2xpY2tcIiwgKGUpID0+XG4gICAgICBwbGFjZSA9IEAucGxhY2VzWyQoZS50YWdldCkuY2xvc2VzdCgnLnNlYXJjaC1pdGVtJykuYXR0cignZGF0YS1pZCcpXVxuICAgICAgQC5kaXNwbGF5U2luZ2xlKHBsYWNlKVxuXG4gIHNob3c6ICgpID0+XG4gICAgQCRwYXJlbnQuYWRkQ2xhc3MoXCJvcGVuXCIpXG4gICAgQCRwYXJlbnQudHJpZ2dlcihcIm9wZW5cIilcbiAgICByZXR1cm4gQFxuXG4gIGNsb3NlOiAoKSA9PlxuICAgIEAkcGFyZW50LnRyaWdnZXIoXCJjbG9zZVwiKVxuICAgIEAkcGFyZW50LnJlbW92ZUNsYXNzKFwib3BlblwiKVxuXG4gICAgcmV0dXJuIEBcbiIsIiAgbW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBNYXJrZXIgZXh0ZW5kcyBnb29nbGUubWFwcy5NYXJrZXJcbiAgICAjIGV4dGVuZCB0aGUgZ29vZ2xlLm1hcHMuTWFya2VyIG9iamVjdCB0byBtYW5hZ2UgZmlsdGVyc1xuICAgIGNvbnN0cnVjdG9yOiAoYXJncykgLT5cbiAgICAgIHN1cGVyIGFyZ3NcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIEBnZXRNYXAoKSwgJ3NlYXJjaC5jaGFuZ2VkJywgQGNoZWNrU2VhcmNoXG5cbiAgICBnZXRJZDogKCkgLT5cbiAgICAgIHJldHVybiBAaW5kZXgudG9TdHJpbmcoKVxuXG4gICAgY2hlY2tTZWFyY2g6IChyZXN1bHRzKSA9PlxuICAgICAgaWYgIXJlc3VsdHMubGVuZ3RoIHx8IEBnZXRJZCgpIGluIHJlc3VsdHNcbiAgICAgICAgQHNldFZpc2libGUodHJ1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldFZpc2libGUoZmFsc2UpXG4iXX0=
;