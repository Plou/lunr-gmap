  module.exports = class Marker extends google.maps.Marker
    # extend the google.maps.Marker object to manage filters
    constructor: (args) ->
      super args
      google.maps.event.addListener @getMap(), 'search.changed', @checkSearch

    getId: () ->
      return @index.toString()

    checkSearch: (results) =>
      if !results.length || @getId() in results
        @setVisible(true)
      else
        @setVisible(false)
