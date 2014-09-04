###
# Popin
## Create a popin
###
module.exports = class Popin
  constructor: (parent) ->
    @id = 'popin-'+(new Date().getTime())
    @$wrapper = $('<div id="'+@id+'" class="popin-wrap close" />')
    @$closeBtn = $('<button class="popin-close">close</button>')
    @$el = $('<div class="popin-content" />')


    @$wrapper.append(@$closeBtn)
    @$wrapper.append(@$el)
    @$parent = $(parent).append(@$wrapper)

    @$closeBtn.on "click", @close

    @$parent.on "list.open", @close
    @$parent.on "list.close", @open

    return @

  # ## setContent
  setContent: (content) ->
    @$el.html(content)
    return @

  # ## show
  open: () =>
    @$wrapper.addClass("open")
    @$wrapper.removeClass("close")
    @$wrapper.trigger("popin.open")
    return @

  # ## close
  close: () =>
    @$wrapper.addClass("close")
    @$wrapper.removeClass("open")
    @$wrapper.trigger("popin.close")

    return @
