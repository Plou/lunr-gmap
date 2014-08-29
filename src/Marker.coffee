  module.exports = class Marker extends google.maps.Marker
    # extend the google.maps.Marker object to manage filters
    constructor: (args) ->
      super args
      google.maps.event.addListener @getMap(), 'search.changed', @filter

    getField: (field) ->
      return @[field].toString()

    filter: (results) =>
      if !results[0].length || @getField(results[1]) in results[0]
        @setVisible(true)
      else
        @setVisible(false)
