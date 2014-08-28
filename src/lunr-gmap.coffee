Gmap = require('./Gmap.coffee')
Search = require('./Search.coffee')
Popin = require('./Popin.coffee')
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

    @initGmap()

    # Init Popin
    @popin = new Popin(@selector)

    # Get the feed
    $.get(@$el.attr('data-feed'))
      .done (data) =>
        @feed = data
        @initFeed()

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
      if @loader.feed
        @addMarkers(@feed)
    return @

  initFeed: ()->
    @loader.feed = true
    if @loader.map
      @addMarkers(@feed)
    # Init search
    @search = new Search(@selector, @feed, @fields)
    @search.$el.on "search.change", (e, data) =>
      google.maps.event.trigger @map.gmap, "search.changed", data.refs
    return @

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

  parseFields: (data) ->
    fields = new Array()
    for field in data.split(',')
      field = field.split('|')
      fields.push([field[0], parseInt(field[1])])
    return fields

# Export the class to the global scope
window.LunrGmap = LunrGmap
