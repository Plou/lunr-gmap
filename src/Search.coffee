module.exports = class Search

  constructor: (parent, data, fields, score) ->
    @$el = $('<div class="map-search" />')
    $(parent).append(@$el)
    @$input = $('<input type="text" />')
    @$el.append(@$input)

    @refs = @results = new Array()
    @score = 0 unless score
    @index = lunr ->
      for field in fields
        this.field(field[0], field[1])
        this.ref('index')

    @$input.on "keyup", @initSearch

    if data?
      for item in data
        @index.add(item)

    @$el.trigger('ready')
    return @

  initSearch: () =>
    @filter()
    @$el.trigger('search.change', {@refs})
    return @

  getResults: () ->
    return @results

  getRefs: () ->
    return @refs

  filter: ->
    @results = @index.search(@getFilter())
    @refs = new Array()
    for result in @results
      if result.score >= @score
        @refs.push(result.ref)
    return @

  clear: ->
    @$input.val("")
    @filter()
    return @

  getFilter: ->
    return @$input.val()
