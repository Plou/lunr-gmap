  module.exports = class Marker extends google.maps.Marker

    # extend the google.maps.Marker object to manage filters
    constructor: (args) ->
      super args
      @bindClick()
      # google.maps.event.addListener in_map_xml.map, 'filter_changed', @checkCategory
      # google.maps.event.addListener in_map_xml.map, 'search_changed', @checkSearch

    setCategory: (category_id) ->
      @category_id = category_id
      return @

    getId: () ->
      return @id.toString()

    getCategory: () ->
      return @category_id

    setPlace: (place) ->
      @place = place
      return @

    getPlace: () ->
      return @place

    checkCategory: () =>
      if @getCategory() in in_map_xml.map.getFilter() || @getCategory() == "5"
        @setVisible(true)
      else
        @setVisible(false)

    checkSearch: () =>
      results = in_map_xml.search.getRefs()
      if !results.length || @getId() in results
        @setVisible(true)
      else
        @setVisible(false)


    bindClick: () ->
      # Open the place page on click
      # google.maps.event.addListener @, 'click', () ->
      #   in_map_xml.map.displaySingle {
      #     title: @title
      #     category: @categoryTxt
      #     subcategory: @subcategory
      #     url: @url
      #     description: @description
      #     chapo: @chapo
      #     address: @address
      #     phone: @phone
      #   }
