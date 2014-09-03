###
# Gmap
## Manage google map initialization and rendering
# Parameters :
#   - parent : The dom selector were the map must be added
#   - latitude : Used to center the map
#   - longitude : Used to center the map
#   - zoom : Zoom used
###
module.exports = class Gmap
  constructor: (parent, @latitude, @longitude, @zoom) ->
    # Set an unique id
    @id = 'map-canvas-'+(new Date().getTime())
    # Create the view node
    $(parent).append('<div id="'+@id+'" class="map-canvas" />')
    @$el = $('#'+@id)

    @zoom = 4 unless @zoom
    @loadGoogleMaps()

    return @

  # ## loadGoogleMaps
  loadGoogleMaps: () ->
    # Get the google map script
    $.getScript 'https://www.google.com/jsapi', =>
      google.load 'maps', '3',
        other_params: 'sensor=false'
        callback: @create
    return @

  # ## create
  create: () =>
    # Options
    styles = [
      featureType: "poi"
      elementType: "labels"
      stylers: [
        visibility: "off"
      ]
    ]

    # Initialize the google map
    @gmap = new google.maps.Map document.getElementById(@id),
      zoom: @zoom,
      center: new google.maps.LatLng(@latitude,@longitude)
      visualRefresh: true
      disableDefaultUI: true
      styles: styles

    @$el.trigger("load")
    return @
