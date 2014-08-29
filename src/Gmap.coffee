module.exports = class Gmap
  constructor: (parent, @latitude, @longitude, @zoom) ->
    @id = 'map-canvas-'+(new Date().getTime())
    $(parent).append('<div id="'+@id+'" class="map-canvas" />')
    @$el = $('#'+@id)

    @zoom = 4 unless @zoom
    @loadGoogleMaps()

    return @

  loadGoogleMaps: () ->
    $.getScript 'https://www.google.com/jsapi', =>
      google.load 'maps', '3',
        other_params: 'sensor=false'
        callback: @create
        libraries: "geometry"
    return @

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
