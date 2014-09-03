###
# Popin
## Create a popin
###
module.exports = class Popin
  constructor: (parent) ->
    @id = 'popin-content-'+(new Date().getTime())
    @$parent = $(parent).append('<div id="'+@id+'" class="popin-content" />')
    @$el = @$parent.find('.popin-content')
    @$closeBtn = $parent.find('.popin-close')
    @$closeBtn.on "click", @close

    return @

  # ## setContent
  setContent: (content) ->
    @$el.html(content)
    return @

  # ## show
  open: () =>
    @$parent.addClass("open")
    @$parent.removeClass("close")
    @$parent.trigger("open")
    return @

  # ## close
  close: () =>
    @$parent.trigger("close")
    @$parent.addClass("close")
    @$parent.removeClass("open")

    return @
