###
# Filters
## Manage filters
# Parameters :
#   - parent : The dom selector were the filter navigation must be added
#   - data : The data to search
#   - fields : The field to filter
#   - @template : The template to build the navigation
###
module.exports = class Filters
  constructor: (parent, data, field, @template) ->
    # Set an unique id
    @id = 'map-filters-'+(new Date().getTime())
    # Create the view node
    $(parent).append('<div id="'+@id+'" class="map-filters" />')
    @$el = $('#'+@id)

    @parseData data, field
    @filter = new Array()

    # Get templates
    $.get(@template)
      .done (data) =>
        @template = _.template(data)
        @render()
        # get all navigation items (filters) and bind clicks
        @$filterBtns = @$el.find('.map-filter')
        @$filterBtns.on "click", @setFilter

    return @

  # ## parseData
  # Get all unique field values
  parseData: (data, field) ->
    @filters = new Array()
    for item in data
      unless item[field] in @filters
        @filters.push item[field]
    return @

  # ## render
  # Create the navigation from filters
  render:  ->
    @$el.html(@template({@filters}))

  # ## setFilter
  # ## Enable/disable a filter
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
