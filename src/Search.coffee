###
# Search
## Manage lunr search engine
# Parameters :
#   - parent : The dom selector were the search field must be added
#   - data : The data to search
#   - fields : The fields to search
#   - event : search input event which trigger the search
#   - score : The minimum score required to show up in results
###
module.exports = class Search
  constructor: (parent, data, fields, event, score) ->
    # Create the search field
    @$el = $('<div class="map-search" />')
    $(parent).append(@$el)
    @$input = $('<input type="text" />')
    @$el.append(@$input)

    @refs = @results = new Array()
    @score = 0 unless score
    event = "keyup" unless event

    # Initialize lunr fields
    @index = lunr ->
      for field in fields
        this.field(field[0], field[1])
        this.ref('index')

    @$input.on event, @initSearch

    # add objects to lunr
    if data?
      for item in data
        @index.add(item)

    @$el.trigger('ready')
    return @

  # ## initSearch
  initSearch: () =>
    @filter()
    @$el.trigger('search.change', {@refs})
    return @

  # ## getResults
  getResults: () ->
    return @results

  # ## getRefs
  getRefs: () ->
    return @refs

  # ## filter
  filter: ->
    @results = @index.search(@getFilter())
    @refs = new Array()
    for result in @results
      if result.score >= @score
        @refs.push(result.ref)
    return @

  # ## clear
  clear: ->
    @$input.val("")
    @filter()
    return @

  # ## getFilter
  # Return the search string
  getFilter: ->
    return @$input.val()
