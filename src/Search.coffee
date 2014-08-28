module.exports = class Search

  constructor: (selector, data, score) ->
    @$field = $(selector)
    @$toggle = $(".search-toggle")
    @refs = @results = new Array()
    @score = if score? then score else 0

    @index = lunr ->
      this.field('title', 100)
      this.field('subcategory')
      this.field('chapo', 10)
      this.field('description')
      this.ref('id')

    @$field.on "keyup", @initSearch

    @$toggle.on "click", @toggle

    if place?
      for place in data
        @index.add(place)

    return @

  initSearch: () =>
    @filter()
    if @refs.length
      @displayResults()
    google?.maps.event.trigger(in_map_xml.map, 'search_changed')

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
    @$field.val("")
    @filter()

  getFilter: ->
    return @$field.val()

  displayResults: () ->
    # in_map_xml.map.displayList(@refs)

  toggle: (e) =>
    e.preventDefault()
    @$field.toggleClass('open')
    # in_map_xml.map.popin.$el.toggleClass('search-open')
