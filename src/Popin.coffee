module.exports = class Popin
  constructor: (selector) ->
    @$el = $(selector).append('<div class="popin-content" />');
    @$content = @$el.find('.popin-content');
    @$closeBtn = @$el.find('.close');
    @$closeBtn.on "click", @close

    return @

  setContent: (content) ->
    @$el.removeClass('.search-list')
    @$content.html(content)

    return @

  bindList: () =>
    @$el.addClass('search-list')
    @$el.find('.search-item').off "click"

    @$el.find('.search-item').on "click", (e) =>
      place = @.places[$(e.taget).closest('.search-item').attr('data-id')]
      @.displaySingle(place)

  show: () =>
    @$el.addClass("open")
    @$el.trigger("open")
    return @

  close: () =>
    @$el.trigger("close")
    @$el.removeClass("open")

    return @
