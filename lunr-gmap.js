;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var Gmap, LunrGmap, Marker, Popin, Search, getUID;

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
      this.$el = $(this.selector);
      this.mapId = 'map-canvas-' + getUID();
      this.$el.html('<div id="' + this.mapId + '" class="map-canvas" />');
      this.map = new Gmap(this.mapId, this.$el.attr('data-latitude'), this.$el.attr('data-longitude'));
      $.get(this.$el.attr('data-feed')).done(function(data) {
        _this.feed = data;
        _this.loader.feed = true;
        if (_this.loader.map) {
          return _this.addMarkers(_this.feed);
        }
      });
      this.map.$el.on("load", function() {
        _this.loader.map = true;
        Marker = require('./Marker.coffee');
        if (_this.loader.feed) {
          return _this.addMarkers(_this.feed);
        }
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
      var marker;
      marker = new Marker({
        id: data.id,
        title: data.title,
        categoryTxt: data.category,
        subcategory: data.subcategory,
        url: data.url,
        description: data.description,
        chapo: data.chapo,
        address: data.address,
        phone: data.phone,
        position: new google.maps.LatLng(data.latitude, data.longitude)
      });
      marker.setMap(this.map.gmap);
      this.markers.push(marker);
      return this;
    };

    return LunrGmap;

  })();

  getUID = function() {
    return new Date().getTime();
  };

  window.LunrGmap = LunrGmap;

}).call(this);


},{"./Gmap.coffee":2,"./Search.coffee":3,"./Popin.coffee":4,"./Marker.coffee":5}],2:[function(require,module,exports){
(function() {
  var Gmap,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Gmap = (function() {
    function Gmap(id, latitude, longitude, zoom) {
      this.id = id;
      this.latitude = latitude;
      this.longitude = longitude;
      this.zoom = zoom;
      this.create = __bind(this.create, this);
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
    function Search(selector, data, score) {
      this.toggle = __bind(this.toggle, this);
      this.initSearch = __bind(this.initSearch, this);
      var place, _i, _len;
      this.$field = $(selector);
      this.$toggle = $(".search-toggle");
      this.refs = this.results = new Array();
      this.score = score != null ? score : 0;
      this.index = lunr(function() {
        this.field('title', 100);
        this.field('subcategory');
        this.field('chapo', 10);
        this.field('description');
        return this.ref('id');
      });
      this.$field.on("keyup", this.initSearch);
      this.$toggle.on("click", this.toggle);
      if (typeof place !== "undefined" && place !== null) {
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          place = data[_i];
          this.index.add(place);
        }
      }
      return this;
    }

    Search.prototype.initSearch = function() {
      this.filter();
      if (this.refs.length) {
        this.displayResults();
      }
      if (typeof google !== "undefined" && google !== null) {
        google.maps.event.trigger(in_map_xml.map, 'search_changed');
      }
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
      this.$field.val("");
      return this.filter();
    };

    Search.prototype.getFilter = function() {
      return this.$field.val();
    };

    Search.prototype.displayResults = function() {};

    Search.prototype.toggle = function(e) {
      e.preventDefault();
      return this.$field.toggleClass('open');
    };

    return Search;

  })();

}).call(this);


},{}],4:[function(require,module,exports){
(function() {
  var Popin,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = Popin = (function() {
    function Popin(selector) {
      this.close = __bind(this.close, this);
      this.show = __bind(this.show, this);
      this.bindList = __bind(this.bindList, this);
      this.$el = $(selector).append('<div class="popin-content" />');
      this.$content = this.$el.find('.popin-content');
      this.$closeBtn = this.$el.find('.close');
      this.$closeBtn.on("click", this.close);
      return this;
    }

    Popin.prototype.setContent = function(content) {
      this.$el.removeClass('.search-list');
      this.$content.html(content);
      return this;
    };

    Popin.prototype.bindList = function() {
      var _this = this;
      this.$el.addClass('search-list');
      this.$el.find('.search-item').off("click");
      return this.$el.find('.search-item').on("click", function(e) {
        var place;
        place = _this.places[$(e.taget).closest('.search-item').attr('data-id')];
        return _this.displaySingle(place);
      });
    };

    Popin.prototype.show = function() {
      this.$el.addClass("open");
      this.$el.trigger("open");
      return this;
    };

    Popin.prototype.close = function() {
      this.$el.trigger("close");
      this.$el.removeClass("open");
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
      this.checkCategory = __bind(this.checkCategory, this);
      Marker.__super__.constructor.call(this, args);
      this.bindClick();
    }

    Marker.prototype.setCategory = function(category_id) {
      this.category_id = category_id;
      return this;
    };

    Marker.prototype.getId = function() {
      return this.id.toString();
    };

    Marker.prototype.getCategory = function() {
      return this.category_id;
    };

    Marker.prototype.setPlace = function(place) {
      this.place = place;
      return this;
    };

    Marker.prototype.getPlace = function() {
      return this.place;
    };

    Marker.prototype.checkCategory = function() {
      var _ref;
      if ((_ref = this.getCategory(), __indexOf.call(in_map_xml.map.getFilter(), _ref) >= 0) || this.getCategory() === "5") {
        return this.setVisible(true);
      } else {
        return this.setVisible(false);
      }
    };

    Marker.prototype.checkSearch = function() {
      var results, _ref;
      results = in_map_xml.search.getRefs();
      if (!results.length || (_ref = this.getId(), __indexOf.call(results, _ref) >= 0)) {
        return this.setVisible(true);
      } else {
        return this.setVisible(false);
      }
    };

    Marker.prototype.bindClick = function() {};

    return Marker;

  })(google.maps.Marker);

}).call(this);


},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL2x1bnItZ21hcC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9HbWFwLmNvZmZlZSIsIi9Vc2Vycy9wbG91L3d3dy9ib3dlci9sdW5yLWdtYXAvc3JjL1NlYXJjaC5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9Qb3Bpbi5jb2ZmZWUiLCIvVXNlcnMvcGxvdS93d3cvYm93ZXIvbHVuci1nbWFwL3NyYy9NYXJrZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtDQUFBLEtBQUEsdUNBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxRQUFBOztDQUFQLENBQ0EsQ0FBUyxHQUFULENBQVMsVUFBQTs7Q0FEVCxDQUVBLENBQVEsRUFBUixFQUFRLFNBQUE7O0NBRlIsQ0FHQSxDQUFTLEdBQVQ7O0NBSEEsQ0FLQSxDQUF1QixHQUFqQixDQUFOO0NBQ2UsRUFBQSxDQUFBLElBQUEsVUFBRTtDQUNiLFNBQUEsRUFBQTtDQUFBLEVBRGEsQ0FBQSxFQUFELEVBQ1o7Q0FBQSxFQUNFLENBREQsRUFBRDtDQUNFLENBQUssQ0FBTCxFQUFBLEdBQUE7Q0FBQSxDQUNNLEVBQU4sQ0FEQSxHQUNBO0NBRkYsT0FBQTtDQUFBLEVBSUEsQ0FBQyxFQUFELEVBQU87Q0FKUCxFQU1TLENBQVIsQ0FBRCxDQUFBLE9BQVM7Q0FOVCxFQU9JLENBQUgsQ0FBUyxDQUFWLEtBQVUsY0FBVjtDQVBBLENBUXdCLENBQXhCLENBQUMsQ0FBVSxDQUFYLFNBQXdCLENBQTRCO0NBUnBELEVBU0EsQ0FBTyxFQUFQLEdBQ1MsRUFESDtDQUVGLEVBQVEsQ0FBUixDQUFDLEdBQUQ7Q0FBQSxFQUNlLENBQWYsQ0FBQyxDQUFNLEVBQVA7Q0FDQSxFQUFBLENBQUcsQ0FBQyxDQUFNLEVBQVY7Q0FDRyxHQUFELENBQUMsS0FBRCxPQUFBO1VBSkU7Q0FE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LEdBQVEsQ0FBUixRQUFPO0NBckJULElBb0JVOztDQXBCVixFQXVCZSxNQUFBLElBQWY7Q0FDRSxHQUFBLE1BQUE7Q0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFrRSxDQUFyRSxHQUFxQixDQUFVLENBQTVCLElBQWtCO0NBQ2xCLEdBQUEsTUFBRCxLQUFBO01BREYsRUFBQTtDQUdHLEdBQUEsQ0FBRCxLQUFBLEtBQUE7UUFKVztDQXZCZixJQXVCZTs7Q0F2QmYsRUE2QmEsTUFBQSxFQUFiO0NBQ0UsU0FBQSxHQUFBO0NBQUEsRUFBVSxHQUFWLENBQUEsR0FBb0I7QUFDaEIsQ0FBSixDQUFzQixDQUFBLENBQW5CLENBQW1CLENBQXRCLENBQVcsUUFBdUI7Q0FDL0IsR0FBQSxNQUFELEtBQUE7TUFERixFQUFBO0NBR0csR0FBQSxDQUFELEtBQUEsS0FBQTtRQUxTO0NBN0JiLElBNkJhOztDQTdCYixFQXFDVyxNQUFYOztDQXJDQTs7Q0FIb0MsR0FBVyxFQUFMO0NBQTVDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJHbWFwID0gcmVxdWlyZSgnLi9HbWFwLmNvZmZlZScpXG5TZWFyY2ggPSByZXF1aXJlKCcuL1NlYXJjaC5jb2ZmZWUnKVxuUG9waW4gPSByZXF1aXJlKCcuL1BvcGluLmNvZmZlZScpXG5NYXJrZXIgPSB1bmRlZmluZWRcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMdW5yR21hcFxuICBjb25zdHJ1Y3RvcjogKEBzZWxlY3RvcikgLT5cbiAgICBAbG9hZGVyID1cbiAgICAgIG1hcDogZmFsc2VcbiAgICAgIGZlZWQ6IGZhbHNlXG5cbiAgICBAJGVsID0gJChAc2VsZWN0b3IpXG5cbiAgICBAbWFwSWQgPSAnbWFwLWNhbnZhcy0nK2dldFVJRCgpXG4gICAgQCRlbC5odG1sKCc8ZGl2IGlkPVwiJytAbWFwSWQrJ1wiIGNsYXNzPVwibWFwLWNhbnZhc1wiIC8+JylcbiAgICBAbWFwID0gbmV3IEdtYXAoQG1hcElkLCBAJGVsLmF0dHIoJ2RhdGEtbGF0aXR1ZGUnKSwgQCRlbC5hdHRyKCdkYXRhLWxvbmdpdHVkZScpKVxuICAgICQuZ2V0KEAkZWwuYXR0cignZGF0YS1mZWVkJykpXG4gICAgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgQGZlZWQgPSBkYXRhXG4gICAgICAgIEBsb2FkZXIuZmVlZCA9IHRydWVcbiAgICAgICAgaWYgQGxvYWRlci5tYXBcbiAgICAgICAgICBAYWRkTWFya2VycyhAZmVlZClcblxuICAgIEBtYXAuJGVsLm9uIFwibG9hZFwiLCA9PlxuICAgICAgQGxvYWRlci5tYXAgPSB0cnVlXG4gICAgICBNYXJrZXIgPSByZXF1aXJlKCcuL01hcmtlci5jb2ZmZWUnKVxuXG4gICAgICBpZiBAbG9hZGVyLmZlZWRcbiAgICAgICAgQGFkZE1hcmtlcnMoQGZlZWQpXG5cbiAgICAgICMgJC5nZXQoZmVlZClcbiAgICAgICMgICAuZG9uZSAoZGF0YSkgPT5cbiAgICAgICMgICAgIEBwbGFjZXMgPSBkYXRhXG4gICAgICAjICAgICBAbG9hZEdvb2dsZU1hcHMoKVxuICAgICAgIyAgICAgaW5fbWFwX3htbC5zZWFyY2ggPSBuZXcgU2VhcmNoKFwiI21hcC1zZWFyY2hcIiwgZGF0YSlcbiAgICAgICNcbiAgICAgICMgJC5nZXQoXCIvdHlwbzNjb25mL2V4dC9pbl9tYXBfeG1sL2Fzc2V0cy90ZW1wbGF0ZV9zaW5nbGUuaHRtbFwiKVxuICAgICAgIyAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgIyAgICAgQHRlbXBsYXRlU2luZ2xlID0gZGF0YVxuICAgICAgI1xuICAgICAgIyAkLmdldChcIi90eXBvM2NvbmYvZXh0L2luX21hcF94bWwvYXNzZXRzL3RlbXBsYXRlX2xpc3QuaHRtbFwiKVxuICAgICAgIyAgIC5kb25lIChkYXRhKSA9PlxuICAgICAgIyAgICAgQHRlbXBsYXRlTGlzdCA9IGRhdGFcblxuICBhZGRNYXJrZXJzOiAoZGF0YSkgLT5cbiAgICBAbWFya2VycyA9IG5ldyBBcnJheVxuICAgIGZvciBtYXJrZXIgaW4gZGF0YVxuICAgICAgQGFkZE1hcmtlcihtYXJrZXIpXG4gICAgcmV0dXJuIEBcblxuICBhZGRNYXJrZXI6IChkYXRhKS0+XG4gICAgbWFya2VyID0gbmV3IE1hcmtlclxuICAgICAgaWQ6IGRhdGEuaWRcbiAgICAgIHRpdGxlOiBkYXRhLnRpdGxlXG4gICAgICBjYXRlZ29yeVR4dDogZGF0YS5jYXRlZ29yeVxuICAgICAgc3ViY2F0ZWdvcnk6IGRhdGEuc3ViY2F0ZWdvcnlcbiAgICAgIHVybDogZGF0YS51cmxcbiAgICAgIGRlc2NyaXB0aW9uOiBkYXRhLmRlc2NyaXB0aW9uXG4gICAgICBjaGFwbzogZGF0YS5jaGFwb1xuICAgICAgYWRkcmVzczogZGF0YS5hZGRyZXNzXG4gICAgICBwaG9uZTogZGF0YS5waG9uZVxuICAgICAgcG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoZGF0YS5sYXRpdHVkZSxkYXRhLmxvbmdpdHVkZSlcbiAgICAgICMgaWNvbjpcbiAgICAgICMgICB1cmw6IFwiL3R5cG8zY29uZi9leHQvaW5fbWFwX3htbC9hc3NldHMvaW1nL3BvaW50ZXJfXCIrcGxhY2UuY2F0ZWdvcnlfaWQrXCIucG5nXCJcbiAgICAgICMgICBhbmNob3I6IG5ldyBnb29nbGUubWFwcy5Qb2ludCg1MCwgNTApXG5cbiAgICAjIGlmIGRhdGEuY2F0ZWdvcnlfaWRcbiAgICAjICAgbWFya2VyLnNldENhdGVnb3J5KGRhdGEuY2F0ZWdvcnlfaWQpXG4gICAgIyAgIG1hcmtlci5jaGVja0NhdGVnb3J5KClcblxuICAgICMgQWRkIHRoZSBtYXJrZXIgdG8gdGhlIG1hcFxuICAgIG1hcmtlci5zZXRNYXAoQG1hcC5nbWFwKVxuXG4gICAgQG1hcmtlcnMucHVzaChtYXJrZXIpXG5cbiAgICByZXR1cm4gQFxuXG5nZXRVSUQgPSAoKSAtPlxuICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKClcblxud2luZG93Lkx1bnJHbWFwID0gTHVuckdtYXBcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgR21hcFxuICBjb25zdHJ1Y3RvcjogKEBpZCwgQGxhdGl0dWRlLCBAbG9uZ2l0dWRlLCBAem9vbSkgLT5cbiAgICBAJGVsID0gJCgnIycrQGlkKVxuICAgIEB6b29tID0gMSB1bmxlc3MgQHpvb20gXG4gICAgQGxvYWRHb29nbGVNYXBzKClcbiAgICAjIEAkZWwgPSAkKCcuZmlsdGVycycpXG4gICAgIyBAJGZpbHRlcnMgPSBAJGVsLmZpbmQoJy5maWx0ZXInKVxuICAgICMgQHNldEZpbHRlcihcImFsbFwiKVxuICAgICMgQCRmaWx0ZXJzLm9uIFwiY2xpY2tcIiwgQHNldEZpbHRlclxuXG4gICAgIyBAcmVuZGVyKClcbiAgICByZXR1cm4gQFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICByZXR1cm4gQFxuXG4gICMgZ2V0RmlsdGVyOiAoKSAtPlxuICAjICAgcmV0dXJuIEBmaWx0ZXJcbiAgI1xuICAjIHNldEZpbHRlcjogKGZpbHRlcikgPT5cbiAgIyAgIGlmIGZpbHRlciBpbnN0YW5jZW9mIGpRdWVyeS5FdmVudFxuICAjICAgICBmaWx0ZXIucHJldmVudERlZmF1bHQoKVxuICAjICAgICBmaWx0ZXIgPSAkKGZpbHRlci50YXJnZXQpLmNsb3Nlc3QoJ2EnKS5hdHRyKCdkYXRhLWZpbHRlcicpXG4gICNcbiAgIyAgIGlmIChmaWx0ZXIgPT0gXCJhbGxcIiB8fCBmaWx0ZXIgPT0gQGdldEZpbHRlcigpLmpvaW4oKSlcbiAgIyAgICAgQGZpbHRlciA9IG5ldyBBcnJheShcIjFcIiwgXCIyXCIsIFwiM1wiLCBcIjRcIiwgXCI1XCIpXG4gICMgICAgIEAkZmlsdGVycy5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAjICAgZWxzZVxuICAjICAgICBAJGZpbHRlcnMubm90KCQoZmlsdGVyLnRhcmdldCkuY2xvc2VzdCgnYScpKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAjICAgICAkKCdbZGF0YS1maWx0ZXI9XCInK2ZpbHRlcisnXCJdJykuYWRkQ2xhc3MoXCJhY3RpdmVcIilcbiAgIyAgICAgQGZpbHRlciA9IG5ldyBBcnJheShmaWx0ZXIpXG4gICNcbiAgIyAgIGdvb2dsZT8ubWFwcy5ldmVudC50cmlnZ2VyKGluX21hcF94bWwubWFwLCAnZmlsdGVyX2NoYW5nZWQnKVxuICAjXG4gICMgICByZXR1cm4gQFxuXG4gIGxvYWRHb29nbGVNYXBzOiAoKSAtPlxuICAgICQuZ2V0U2NyaXB0ICdodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpJywgPT5cbiAgICAgIGdvb2dsZS5sb2FkICdtYXBzJywgJzMnLFxuICAgICAgICBvdGhlcl9wYXJhbXM6ICdzZW5zb3I9ZmFsc2UnXG4gICAgICAgIGNhbGxiYWNrOiBAY3JlYXRlXG4gICAgICAgIGxpYnJhcmllczogXCJnZW9tZXRyeVwiXG4gICAgcmV0dXJuIEBcblxuICBjcmVhdGU6ICgpID0+XG4gICAgc3R5bGVzID0gW1xuICAgICAgZmVhdHVyZVR5cGU6IFwicG9pXCJcbiAgICAgIGVsZW1lbnRUeXBlOiBcImxhYmVsc1wiXG4gICAgICBzdHlsZXJzOiBbXG4gICAgICAgIHZpc2liaWxpdHk6IFwib2ZmXCJcbiAgICAgIF1cbiAgICBdXG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGdvb2dsZSBtYXBcbiAgICBAZ21hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoQGlkKSxcbiAgICAgIHpvb206IEB6b29tLFxuICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKEBsYXRpdHVkZSxAbG9uZ2l0dWRlKVxuICAgICAgdmlzdWFsUmVmcmVzaDogdHJ1ZVxuICAgICAgZGlzYWJsZURlZmF1bHRVSTogdHJ1ZVxuICAgICAgc3R5bGVzOiBzdHlsZXNcbiAgICBAJGVsLnRyaWdnZXIoXCJsb2FkXCIpXG5cbiAgICByZXR1cm4gQFxuXG4gICMgZGlzcGxheVNpbmdsZTogKGRhdGEpIC0+XG4gICMgICBjb250ZW50ID0gXy50ZW1wbGF0ZSBAdGVtcGxhdGVTaW5nbGUsIGRhdGFcbiAgIyAgIEBwb3Bpbi5zZXRDb250ZW50KGNvbnRlbnQpXG4gICMgICBAcG9waW4uc2hvdygpXG4gICNcbiAgIyAgIHJldHVybiBAXG4gICNcbiAgIyBkaXNwbGF5TGlzdDogKHJlc3VsdHMpIC0+XG4gICMgICBjb250ZW50ID0gXCJcIlxuICAjICAgZm9yIGlkIGluIHJlc3VsdHNcbiAgIyAgICAgY29udGVudCArPSBfLnRlbXBsYXRlIEB0ZW1wbGF0ZUxpc3QsIEBwbGFjZXNbaWRdXG4gICNcbiAgIyAgIEBwb3Bpbi5zZXRDb250ZW50KGNvbnRlbnQpXG4gICMgICBAcG9waW4uc2hvdygpXG4gICMgICBAcG9waW4uYmluZExpc3QoKVxuICAjXG4gICMgICByZXR1cm4gQFxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZWFyY2hcblxuICBjb25zdHJ1Y3RvcjogKHNlbGVjdG9yLCBkYXRhLCBzY29yZSkgLT5cbiAgICBAJGZpZWxkID0gJChzZWxlY3RvcilcbiAgICBAJHRvZ2dsZSA9ICQoXCIuc2VhcmNoLXRvZ2dsZVwiKVxuICAgIEByZWZzID0gQHJlc3VsdHMgPSBuZXcgQXJyYXkoKVxuICAgIEBzY29yZSA9IGlmIHNjb3JlPyB0aGVuIHNjb3JlIGVsc2UgMFxuXG4gICAgQGluZGV4ID0gbHVuciAtPlxuICAgICAgdGhpcy5maWVsZCgndGl0bGUnLCAxMDApXG4gICAgICB0aGlzLmZpZWxkKCdzdWJjYXRlZ29yeScpXG4gICAgICB0aGlzLmZpZWxkKCdjaGFwbycsIDEwKVxuICAgICAgdGhpcy5maWVsZCgnZGVzY3JpcHRpb24nKVxuICAgICAgdGhpcy5yZWYoJ2lkJylcblxuICAgIEAkZmllbGQub24gXCJrZXl1cFwiLCBAaW5pdFNlYXJjaFxuXG4gICAgQCR0b2dnbGUub24gXCJjbGlja1wiLCBAdG9nZ2xlXG5cbiAgICBpZiBwbGFjZT9cbiAgICAgIGZvciBwbGFjZSBpbiBkYXRhXG4gICAgICAgIEBpbmRleC5hZGQocGxhY2UpXG5cbiAgICByZXR1cm4gQFxuXG4gIGluaXRTZWFyY2g6ICgpID0+XG4gICAgQGZpbHRlcigpXG4gICAgaWYgQHJlZnMubGVuZ3RoXG4gICAgICBAZGlzcGxheVJlc3VsdHMoKVxuICAgIGdvb2dsZT8ubWFwcy5ldmVudC50cmlnZ2VyKGluX21hcF94bWwubWFwLCAnc2VhcmNoX2NoYW5nZWQnKVxuXG4gICAgcmV0dXJuIEBcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJldHVybiBAcmVzdWx0c1xuXG4gIGdldFJlZnM6ICgpIC0+XG4gICAgcmV0dXJuIEByZWZzXG5cbiAgZmlsdGVyOiAtPlxuICAgIEByZXN1bHRzID0gQGluZGV4LnNlYXJjaChAZ2V0RmlsdGVyKCkpXG4gICAgQHJlZnMgPSBuZXcgQXJyYXkoKVxuICAgIGZvciByZXN1bHQgaW4gQHJlc3VsdHNcbiAgICAgIGlmIHJlc3VsdC5zY29yZSA+PSBAc2NvcmVcbiAgICAgICAgQHJlZnMucHVzaChyZXN1bHQucmVmKVxuICAgIHJldHVybiBAXG5cbiAgY2xlYXI6IC0+XG4gICAgQCRmaWVsZC52YWwoXCJcIilcbiAgICBAZmlsdGVyKClcblxuICBnZXRGaWx0ZXI6IC0+XG4gICAgcmV0dXJuIEAkZmllbGQudmFsKClcblxuICBkaXNwbGF5UmVzdWx0czogKCkgLT5cbiAgICAjIGluX21hcF94bWwubWFwLmRpc3BsYXlMaXN0KEByZWZzKVxuXG4gIHRvZ2dsZTogKGUpID0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgQCRmaWVsZC50b2dnbGVDbGFzcygnb3BlbicpXG4gICAgIyBpbl9tYXBfeG1sLm1hcC5wb3Bpbi4kZWwudG9nZ2xlQ2xhc3MoJ3NlYXJjaC1vcGVuJylcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUG9waW5cbiAgY29uc3RydWN0b3I6IChzZWxlY3RvcikgLT5cbiAgICBAJGVsID0gJChzZWxlY3RvcikuYXBwZW5kKCc8ZGl2IGNsYXNzPVwicG9waW4tY29udGVudFwiIC8+Jyk7XG4gICAgQCRjb250ZW50ID0gQCRlbC5maW5kKCcucG9waW4tY29udGVudCcpO1xuICAgIEAkY2xvc2VCdG4gPSBAJGVsLmZpbmQoJy5jbG9zZScpO1xuICAgIEAkY2xvc2VCdG4ub24gXCJjbGlja1wiLCBAY2xvc2VcblxuICAgIHJldHVybiBAXG5cbiAgc2V0Q29udGVudDogKGNvbnRlbnQpIC0+XG4gICAgQCRlbC5yZW1vdmVDbGFzcygnLnNlYXJjaC1saXN0JylcbiAgICBAJGNvbnRlbnQuaHRtbChjb250ZW50KVxuXG4gICAgcmV0dXJuIEBcblxuICBiaW5kTGlzdDogKCkgPT5cbiAgICBAJGVsLmFkZENsYXNzKCdzZWFyY2gtbGlzdCcpXG4gICAgQCRlbC5maW5kKCcuc2VhcmNoLWl0ZW0nKS5vZmYgXCJjbGlja1wiXG5cbiAgICBAJGVsLmZpbmQoJy5zZWFyY2gtaXRlbScpLm9uIFwiY2xpY2tcIiwgKGUpID0+XG4gICAgICBwbGFjZSA9IEAucGxhY2VzWyQoZS50YWdldCkuY2xvc2VzdCgnLnNlYXJjaC1pdGVtJykuYXR0cignZGF0YS1pZCcpXVxuICAgICAgQC5kaXNwbGF5U2luZ2xlKHBsYWNlKVxuXG4gIHNob3c6ICgpID0+XG4gICAgQCRlbC5hZGRDbGFzcyhcIm9wZW5cIilcbiAgICBAJGVsLnRyaWdnZXIoXCJvcGVuXCIpXG4gICAgcmV0dXJuIEBcblxuICBjbG9zZTogKCkgPT5cbiAgICBAJGVsLnRyaWdnZXIoXCJjbG9zZVwiKVxuICAgIEAkZWwucmVtb3ZlQ2xhc3MoXCJvcGVuXCIpXG5cbiAgICByZXR1cm4gQFxuIiwiICBtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE1hcmtlciBleHRlbmRzIGdvb2dsZS5tYXBzLk1hcmtlclxuXG4gICAgIyBleHRlbmQgdGhlIGdvb2dsZS5tYXBzLk1hcmtlciBvYmplY3QgdG8gbWFuYWdlIGZpbHRlcnNcbiAgICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgICBzdXBlciBhcmdzXG4gICAgICBAYmluZENsaWNrKClcbiAgICAgICMgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIgaW5fbWFwX3htbC5tYXAsICdmaWx0ZXJfY2hhbmdlZCcsIEBjaGVja0NhdGVnb3J5XG4gICAgICAjIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIGluX21hcF94bWwubWFwLCAnc2VhcmNoX2NoYW5nZWQnLCBAY2hlY2tTZWFyY2hcblxuICAgIHNldENhdGVnb3J5OiAoY2F0ZWdvcnlfaWQpIC0+XG4gICAgICBAY2F0ZWdvcnlfaWQgPSBjYXRlZ29yeV9pZFxuICAgICAgcmV0dXJuIEBcblxuICAgIGdldElkOiAoKSAtPlxuICAgICAgcmV0dXJuIEBpZC50b1N0cmluZygpXG5cbiAgICBnZXRDYXRlZ29yeTogKCkgLT5cbiAgICAgIHJldHVybiBAY2F0ZWdvcnlfaWRcblxuICAgIHNldFBsYWNlOiAocGxhY2UpIC0+XG4gICAgICBAcGxhY2UgPSBwbGFjZVxuICAgICAgcmV0dXJuIEBcblxuICAgIGdldFBsYWNlOiAoKSAtPlxuICAgICAgcmV0dXJuIEBwbGFjZVxuXG4gICAgY2hlY2tDYXRlZ29yeTogKCkgPT5cbiAgICAgIGlmIEBnZXRDYXRlZ29yeSgpIGluIGluX21hcF94bWwubWFwLmdldEZpbHRlcigpIHx8IEBnZXRDYXRlZ29yeSgpID09IFwiNVwiXG4gICAgICAgIEBzZXRWaXNpYmxlKHRydWUpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRWaXNpYmxlKGZhbHNlKVxuXG4gICAgY2hlY2tTZWFyY2g6ICgpID0+XG4gICAgICByZXN1bHRzID0gaW5fbWFwX3htbC5zZWFyY2guZ2V0UmVmcygpXG4gICAgICBpZiAhcmVzdWx0cy5sZW5ndGggfHwgQGdldElkKCkgaW4gcmVzdWx0c1xuICAgICAgICBAc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0VmlzaWJsZShmYWxzZSlcblxuXG4gICAgYmluZENsaWNrOiAoKSAtPlxuICAgICAgIyBPcGVuIHRoZSBwbGFjZSBwYWdlIG9uIGNsaWNrXG4gICAgICAjIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyIEAsICdjbGljaycsICgpIC0+XG4gICAgICAjICAgaW5fbWFwX3htbC5tYXAuZGlzcGxheVNpbmdsZSB7XG4gICAgICAjICAgICB0aXRsZTogQHRpdGxlXG4gICAgICAjICAgICBjYXRlZ29yeTogQGNhdGVnb3J5VHh0XG4gICAgICAjICAgICBzdWJjYXRlZ29yeTogQHN1YmNhdGVnb3J5XG4gICAgICAjICAgICB1cmw6IEB1cmxcbiAgICAgICMgICAgIGRlc2NyaXB0aW9uOiBAZGVzY3JpcHRpb25cbiAgICAgICMgICAgIGNoYXBvOiBAY2hhcG9cbiAgICAgICMgICAgIGFkZHJlc3M6IEBhZGRyZXNzXG4gICAgICAjICAgICBwaG9uZTogQHBob25lXG4gICAgICAjICAgfVxuIl19
;