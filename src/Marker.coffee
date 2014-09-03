###
# Marker
## Extends google.maps.Marker to enable filtering
###
module.exports = class Marker extends google.maps.Marker
  constructor: (args) ->
    super args

    @engines = new Object()

    google.maps.event.addListener @getMap(), 'search.change', @filter

  # ## getField
  getField: (field) ->
    return @[field].toString()

  # ## filter
  filter: (results) =>
    # get the engine indentifier
    if results[2]
      engineId = results[2]
    else throw new Error("The `search.change` pust pass an string identifier as thrid argument")

    # Register the engine on the first filter
    unless @engines[engineId]
      @engines[engineId] = new Object()

    @engines[engineId].field = results[1]
    @engines[engineId].results = results[0]

    for engineId of @engines
      engine = @engines[engineId]
      if !engine.results.length || @getField(engine.field) in engine.results
        @setVisible(true)
      else
        @setVisible(false)
        return @
    return @