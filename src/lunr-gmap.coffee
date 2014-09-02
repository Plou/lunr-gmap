Gmap = require('./Gmap.coffee')
Search = require('./Search.coffee')
Popin = require('./Popin.coffee')
Filters = require('./Filters.coffee')
Marker = undefined

module.exports = class LunrGmap
  constructor: (@selector) ->
    @loader =
      map: false
      feed: false
    @templates =
      single: ""
      list: ""

    @$el = $(@selector)
    @templates.single = @$el.attr('data-templateSingle')
    @templates.list = @$el.attr('data-templateList')
    @fields = @parseFields(@$el.attr('data-lunr'))
    @filter = @$el.attr('data-filter')

    @initGmap()

    # Init Popin
    @popin = new Popin(@selector)

    # Get the feed
    $.get(@$el.attr('data-feed'))
      .done (data) =>
        @feed = data
        @initFeed()
        @initFilters()

    # Get templates
    $.get(@templates.single)
      .done (data) =>
        @templates.single = _.template(data)

    $.get(@templates.list)
      .done (data) =>
        @templates.list = _.template(data)

  initGmap: ->
    @map = new Gmap(@selector, @$el.attr('data-latitude'), @$el.attr('data-longitude'), parseInt(@$el.attr('data-zoom')))
    @map.$el.on "load", =>
      @loader.map = true
      Marker = require('./Marker.coffee')
      # Init marker if the feed is loaded
      if @loader.feed
        @addMarkers(@feed)

      google.maps.event.addListener @map.gmap, 'search.changed', (result) =>
        if result[1] == "index"
          @displayMarkersFromRefs(result[0])
    return @

  initFeed: ()->
    @loader.feed = true

    # Init marker if the map is loaded
    if @loader.map
      @addMarkers(@feed)

    # Init search
    @search = new Search(@selector, @feed, @fields)
    @search.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.changed", [data.refs, "index"]

    return @

  # Init Filters
  initFilters: ()->
    @filters = new Filters(@selector, @feed, @filter, @$el.attr('data-templateFilters'))
    @filters.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.changed", [data.filter, @filter]

  addMarkers: (data) ->
    @markers = new Array
    for marker in data
      @addMarker(marker)
    return @

  addMarker: (data)->
    data.position = new google.maps.LatLng(data.latitude,data.longitude)
    data.map = @map.gmap
    marker = new Marker(data)

    @markers.push(marker)

    google.maps.event.addListener marker, 'click', () =>
      @displaySingle(marker)
    return @

  displaySingle: (marker) ->
    @popin.setContent(@templates.single(marker))
    return @

  displayList: (markers) ->
    @popin.setContent(@templates.list(markers: markers))
    return @

  displayMarkersFromRefs: (result) =>
    @displayList(@getMarkersFromRefs(result))
    return @

  parseFields: (data) ->
    fields = new Array()
    for field in data.split(',')
      field = field.split('|')
      fields.push([field[0], parseInt(field[1])])
    return fields

  getMarkersFromRefs: (result) =>
    markers = new Array()
    if result.length
      for index in result
        markers.push @markers[index]
    return markers

# Export the class to the global scope
window.LunrGmap = LunrGmap
