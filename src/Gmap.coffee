module.exports = class Gmap
  constructor: (parent, @latitude, @longitude, @zoom) ->
    @id = 'map-canvas-'+(new Date().getTime())
    $(parent).append('<div id="'+@id+'" class="map-canvas" />')
    @$el = $('#'+@id)

    @zoom = 4 unless @zoom
    @loadGoogleMaps()
    # @$el = $('.filters')
    # @$filters = @$el.find('.filter')
    # @setFilter("all")
    # @$filters.on "click", @setFilter

    return @

  # getFilter: () ->
  #   return @filter
  #
  # setFilter: (filter) =>
  #   if filter instanceof jQuery.Event
  #     filter.preventDefault()
  #     filter = $(filter.target).closest('a').attr('data-filter')
  #
  #   if (filter == "all" || filter == @getFilter().join())
  #     @filter = new Array("1", "2", "3", "4", "5")
  #     @$filters.removeClass("active")
  #   else
  #     @$filters.not($(filter.target).closest('a')).removeClass("active")
  #     $('[data-filter="'+filter+'"]').addClass("active")
  #     @filter = new Array(filter)
  #
  #   google?.maps.event.trigger(in_map_xml.map, 'filter_changed')
  #
  #   return @

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

  # displaySingle: (data) ->
  #   content = _.template @templateSingle, data
  #   @popin.setContent(content)
  #   @popin.show()
  #
  #   return @
  #
  # displayList: (results) ->
  #   content = ""
  #   for id in results
  #     content += _.template @templateList, @places[id]
  #
  #   @popin.setContent(content)
  #   @popin.show()
  #   @popin.bindList()
  #
  #   return @
