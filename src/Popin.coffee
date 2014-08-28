module.exports = class Popin
  constructor: (parent) ->
    @id = 'popin-content-'+(new Date().getTime())
    @$parent = $(parent).append('<div id="'+@id+'" class="popin-content" />')
    @$el = @$parent.find('.popin-content')
    @$closeBtn = @$parent.find('.close')
    @$closeBtn.on "click", @close

    return @

  setContent: (content) ->
    @$el.html(content)

    return @

  bindList: () =>
    @$parent.addClass('search-list')
    @$parent.find('.search-item').off "click"

    @$parent.find('.search-item').on "click", (e) =>
      place = @.places[$(e.taget).closest('.search-item').attr('data-id')]
      @.displaySingle(place)

  show: () =>
    @$parent.addClass("open")
    @$parent.trigger("open")
    return @

  close: () =>
    @$parent.trigger("close")
    @$parent.removeClass("open")

    return @
