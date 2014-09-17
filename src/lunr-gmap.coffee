Gmap = require('./Gmap.coffee')
Search = require('./Search.coffee')
Filters = require('./Filters.coffee')
Popin = require('./Popin.coffee')
List = require('./List.coffee')
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
    @loader = new Loader()
    @loader.set("feed", false)
    @loader.set("map", false)
    @loader.set("list", false)

    @loader.emmitter.on "load.update", =>
      # Init marker if the map is loaded
      if @loader.isLoaded()
        # We can now add markers from the feed to the map
        @addMarkers(@feed)

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

    # Create a popin
    @popin = new Popin(@selector)

    # Create the list to display results
    @list = new List(@selector, @templates.list)
    @list.$el.on "load", =>
      @loader.set("list", true)

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
    return @

  # ## initGmap
  initGmap: ->
    # Create a new Gmap object
    @map = new Gmap(@selector, @$el.attr('data-latitude'), @$el.attr('data-longitude'), parseInt(@$el.attr('data-zoom')))
    # Listen to map loading
    @map.$el.on "load", =>
      # Once the map is loaded we can get the Marker object which extend `google.maps.Marker`
      Marker = require('./Marker.coffee')
      @loader.set("map", true)
    return @

  # ## initFeed
  initFeed: ()->
    # Init lunr search engine
    @search = new Search(@selector, @feed, @fields)
    # On lunr `search.changes` we trigger the same event on map
    @search.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.change", [data.refs, "index", "lunr"]
    @loader.set("feed", true)

    return @

  # ## initFilters
  initFilters: ()->
    @filters = new Filters(@selector, @feed, @filter, @$el.attr('data-templateFilters'))
    # On filters `search.changes` we trigger the same event on map
    @filters.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.change", [data.filter, @filter, "filters"]
    return @
  # ## addMarkers
  addMarkers: (data) ->
    @markers = new Array()
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

    @list.addMarker(marker)

    # Listen to marker click event to disply the marker's content
    google.maps.event.addListener marker, 'click', () =>
      @displaySingle(marker)
    return @

  # ## displaySingle
  displaySingle: (marker) ->
    @popin.setContent(@templates.single(marker))
    @popin.open()
    return @


  # ## parseFields
  # Get fields to search from `data-lunr` attribute
  parseFields: (data) ->
    fields = new Array()
    for field in data.split(',')
      field = field.split('|')
      fields.push([field[0], parseInt(field[1])])
    return fields

  # ## checkDependencies
  # Checks if jQuery and underscore are included
  checkDependencies: ->
    if !$? then throw new Error('jQuery not found')
    if !_? then throw new Error('underscore not found')
    return @

# Export the class to the global scope
window.LunrGmap = LunrGmap

class Loader
  constructor: ->
    @emmitter = $({})
    @modules = new Object()
    return @

  isLoaded: =>
    for module of @modules
      unless @modules[module]
        return false
    return true

  set: (module, value) =>
    @modules[module] = value
    @emmitter.trigger "load.update"
    return @

return
