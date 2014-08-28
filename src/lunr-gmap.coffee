Gmap = require('./Gmap.coffee')
Search = require('./Search.coffee')
Popin = require('./Popin.coffee')
Marker = undefined

module.exports = class LunrGmap
  constructor: (@selector) ->
    @loader =
      map: false
      feed: false

    @$el = $(@selector)

    @mapId = 'map-canvas-'+getUID()
    @$el.html('<div id="'+@mapId+'" class="map-canvas" />')
    @map = new Gmap(@mapId, @$el.attr('data-latitude'), @$el.attr('data-longitude'))
    $.get(@$el.attr('data-feed'))
      .done (data) =>
        @feed = data
        @loader.feed = true
        if @loader.map
          @addMarkers(@feed)

    @map.$el.on "load", =>
      @loader.map = true
      Marker = require('./Marker.coffee')

      if @loader.feed
        @addMarkers(@feed)

      # $.get(feed)
      #   .done (data) =>
      #     @places = data
      #     @loadGoogleMaps()
      #     in_map_xml.search = new Search("#map-search", data)
      #
      # $.get("/typo3conf/ext/in_map_xml/assets/template_single.html")
      #   .done (data) =>
      #     @templateSingle = data
      #
      # $.get("/typo3conf/ext/in_map_xml/assets/template_list.html")
      #   .done (data) =>
      #     @templateList = data

  addMarkers: (data) ->
    @markers = new Array
    for marker in data
      @addMarker(marker)
    return @

  addMarker: (data)->
    marker = new Marker
      id: data.id
      title: data.title
      categoryTxt: data.category
      subcategory: data.subcategory
      url: data.url
      description: data.description
      chapo: data.chapo
      address: data.address
      phone: data.phone
      position: new google.maps.LatLng(data.latitude,data.longitude)
      # icon:
      #   url: "/typo3conf/ext/in_map_xml/assets/img/pointer_"+place.category_id+".png"
      #   anchor: new google.maps.Point(50, 50)

    # if data.category_id
    #   marker.setCategory(data.category_id)
    #   marker.checkCategory()

    # Add the marker to the map
    marker.setMap(@map.gmap)

    @markers.push(marker)

    return @

getUID = () ->
  return new Date().getTime()

window.LunrGmap = LunrGmap
