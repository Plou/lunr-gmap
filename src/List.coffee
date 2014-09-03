Popin = require('./Popin.coffee')

###
# List
## List Marker
###
module.exports = class List extends Popin
  constructor: (parent, @template) ->
    @id = 'list-content-'+(new Date().getTime())
    @$parent = $(parent).append('<div id="'+@id+'" class="list-content" />')
    @$el = @$parent.find('.list-content')
    @$closeBtn = @$parent.find('.close')
    @$closeBtn.on "click", @close
    @markers = new Array()

    $.get(@template)
      .done (data) =>
        @template = _.template(data)
        @$el.trigger "load"
    return @

  # ## addMarker
  addMarker: (marker) ->
    @markers.push(marker)
    @render(@markers)

    google.maps.event.addListener marker, 'visible_changed', (e) =>
      console.log e
      # @showMarker()
      # @hideMarker()

  # ## showMarker
  showMarker: (marker) ->
    console.log "show", marker

  # ## render
  hideMarker: (marker) ->
    console.log "show", marker

  # ## render
  render: (markers) ->
    @setContent(@template(markers: markers))
    return @