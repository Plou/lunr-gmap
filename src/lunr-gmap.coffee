Gmap = require('./Gmap.coffee')
Search = require('./Search.coffee')
Popin = require('./Popin.coffee')
Filters = require('./Filters.coffee')
Marker = undefined

###
# LunrGmap
## Create a google map view from a feed with lunr search and category navigation
# Manage initialization, loading and events
# Handle the display of contents and results list
###

module.exports = class LunrGmap
  constructor: (@selector) ->
    # Loader stores the load state of map and feed
    @loader =
      map: false
      feed: false
    # Underscore templates
    @templates =
      single: ""
      list: ""

    @checkDependencies();

    # Retrieve options frome element attributes
    @$el = $(@selector)
    if @$el.length > 1
      throw new Error("selector argument must refer to an unique node")

    # Remove alternative content
    @$el.empty()

    @templates.single = @$el.attr('data-templateSingle')
    @templates.list = @$el.attr('data-templateList')
    @fields = @parseFields(@$el.attr('data-lunr'))
    @filter = @$el.attr('data-filter')

    @initGmap()

    # Create a popin to display results
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

  # ## initGmap
  initGmap: ->
    # Create a new Gmap object
    @map = new Gmap(@selector, @$el.attr('data-latitude'), @$el.attr('data-longitude'), parseInt(@$el.attr('data-zoom')))
    # Listen to map loading
    @map.$el.on "load", =>
      @loader.map = true
      # Once the map is loaded we can get the Marker object which extend `google.maps.Marker`
      Marker = require('./Marker.coffee')
      # Init marker if the feed is loaded
      if @loader.feed
        # We can now add markers from the feed to the map
        @addMarkers(@feed)

      # Listen to map `search.changed` from lunr to display a list of results
      google.maps.event.addListener @map.gmap, 'search.change', (result) =>
        if result[2] == "lunr"
          @displayMarkersFromRefs(result[0])
    return @

  # ## initFeed
  initFeed: ()->
    @loader.feed = true

    # Init marker if the map is loaded
    if @loader.map
      # We can now add markers from the feed to the map
      @addMarkers(@feed)

    # Init lunr search engine
    @search = new Search(@selector, @feed, @fields)
    # On lunr `search.changes` we trigger the same event on map
    @search.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.change", [data.refs, "index", "lunr"]

    return @

  # ## initFilters
  initFilters: ()->
    @filters = new Filters(@selector, @feed, @filter, @$el.attr('data-templateFilters'))
    # On filters `search.changes` we trigger the same event on map
    @filters.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.change", [data.filter, @filter, "filters"]

  # ## addMarkers
  addMarkers: (data) ->
    @markers = new Array
    # For each object of the feed we add a marker
    for marker in data
      @addMarker(marker)
    return @

  # ## addMarker
  addMarker: (data)->
    data.position = new google.maps.LatLng(data.latitude,data.longitude)
    data.map = @map.gmap

    marker = new Marker(data)
    @markers.push(marker)

    # Listen to marker click event to disply the marker's content
    google.maps.event.addListener marker, 'click', () =>
      @displaySingle(marker)
    return @

  # ## displaySingle
  displaySingle: (marker) ->
    @popin.setContent(@templates.single(marker))
    return @

  # ## displayList
  displayList: (markers) ->
    @popin.setContent(@templates.list(markers: markers))
    return @

  # ## displayMarkersFromRefs
  displayMarkersFromRefs: (result) =>
    @displayList(@getMarkersFromRefs(result))
    return @

  # ## parseFields
  # Get fields to search from `data-lunr` attribute
  parseFields: (data) ->
    fields = new Array()
    for field in data.split(',')
      field = field.split('|')
      fields.push([field[0], parseInt(field[1])])
    return fields

  # ## getMarkersFromRefs
  # Get a marker from a index array
  getMarkersFromRefs: (result) =>
    markers = new Array()
    if result.length
      for index in result
        markers.push @markers[index]
    return markers

  # ## checkDependencies
  # Checks if jQuery and underscore are included
  checkDependencies: ->
    if !$? then throw new Error('jQuery not found')
    if !_? then throw new Error('underscore not found')

# Export the class to the global scope
window.LunrGmap = LunrGmap
