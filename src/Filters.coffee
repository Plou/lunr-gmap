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
      $filter = $(filter.target).closest('.map-filter')
      filter = $filter.attr('data-filter')

    if (filter == "all" || filter in @filter)
      $filter.removeClass("active")
      @filter.splice(@filter.indexOf(filter), 1)
    else
      $filter.addClass("active")
      @filter.push(filter)

    @$el.trigger('search.change', {@filter})

    return @
