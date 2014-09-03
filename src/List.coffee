Popin = require('./Popin.coffee')

###
# List
## List Marker
###
module.exports = class List extends Popin
  constructor: (parent, template) ->
    @id = 'list-content-'+(new Date().getTime())
    @$parent = $(parent).append('<div id="'+@id+'" class="list-content" />')
    @$el = @$parent.find('.list-content')
    @markers = new Array()

    $.get(template)
      .done (data) =>
        @template = _.template(data)
        @$el.trigger "load"
    return @

  # ## addMarker
  addMarker: (marker) ->
    @markers.push(marker)
    @render(@markers)

    google.maps.event.addListener marker, 'visible_changed', (e) =>
      if marker.visible then @showMarker(marker) else @hideMarker(marker)

  # ## showMarker
  showMarker: (marker) ->
    @$el.find('[data-index="'+marker.getField("index")+'"]').show()
    return @

  # ## render
  hideMarker: (marker) ->
    @$el.find('[data-index="'+marker.getField("index")+'"]').hide()
    return @


  # ## show
  open: () =>
    @$el.addClass("open")
    @$el.removeClass("close")
    @$el.trigger("open")
    return @

  # ## close
  close: () =>
    @$el.trigger("close")
    @$el.addClass("close")
    @$el.removeClass("open")

  # ## render
  render: (markers) ->
    @setContent(@template(markers: markers))
    @$closeBtn = @$parent.find('.list-close')
    @$closeBtn.on "click", @close

    unless @$el.find('[data-index]').length
      throw new Error('The attribute `data-index="<%=marker.index%>` is required in template file" ')
    return @
