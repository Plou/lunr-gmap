###
# Marker
## Extends google.maps.Marker to enable filtering
###
module.exports = class Marker extends google.maps.Marker
  constructor: (args) ->
    super args
    google.maps.event.addListener @getMap(), 'search.change', @filter

  # ## getField
  getField: (field) ->
    return @[field].toString()

  # ## filter
  filter: (results) =>
    if !results[0].length || @getField(results[1]) in results[0]
      @setVisible(true)
    else
      @setVisible(false)
