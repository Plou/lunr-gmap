module.exports = class Filters
  constructor: (parent, data, field, @template) ->
    @id = 'map-filters-'+(new Date().getTime())
    $(parent).append('<div id="'+@id+'" class="map-filters" />')
    @$el = $('#'+@id)
    @parseData data, field
    @filter = new Array()

    # Get templates
    $.get(@template)
      .done (data) =>
        @template = _.template(data)
        @render()
        @$filterBtns = @$el.find('.map-filter')
        @$filterBtns.on "click", @setFilter

    return @

  # Get all unique field values
  parseData: (data, field) ->
    @filters = new Array()
    for item in data
      unless item[field] in @filters
        @filters.push item[field]
    return @

  render:  ->
    @$el.html(@template({@filters}))

  setFilter: (filter) =>
    if filter instanceof jQuery.Event
      filter.preventDefault()
      filter = $(filter.target).closest('.map-filter').attr('data-filter')

    console.log filter, @filter.join()
    if (filter == "all" || filter == @filter.join())
      @$filterBtns.removeClass("active")
      @filter = new Array()
    else
      @$filterBtns.not($(filter.target).closest('.map-filter')).removeClass("active")
      $('[data-filter="'+filter+'"]').addClass("active")
      @filter = new Array(filter)

    @$el.trigger('search.change', {@filter})

    return @

  # getFilter: () ->
  #   return @filter
  #

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
