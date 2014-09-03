# lunr-gmap
## Create a google map view from a feed

This Script is currently under development. It's functionnal but not as easy to customize as you may want. Feel free to make pull requests of create [issues](https://github.com/Plou/lunr-gmap/issues).

## What is lunr-gmap?

It's an easy way to set up a google map view from a custom feed.
Uses a [JSON](http://www.json-generator.com/api/json/get/bZaGvEKgia) feed to fill up a google map an it allow you to search in any field of the feed with [lunr.js](http://lunrjs.com/). A "category" navigation is also generated from a choosen field.

## Usage
You'll need four steps in order to use lunr-gmap :
  - Include [jQuery](http://jquery.com/), [Underscore](underscorejs.org) & [lunr-gmap.js](https://github.com/Plou/lunr-gmap) in you page. It is also available on [bower](http://bower.io).
  - Then add the tag with all required attributes
  - Three templates as to be added.(`data-index` attribute in list template is required)  
  - Initialize the google map view

```html
<div id="map-view"
  data-latitude="50"
  data-longitude="2.5"
  data-zoom="5"
  data-filter="favoriteFruit"
  data-lunr="name|10,gender|10,eyeColor|5,tags|1"
  data-templateSingle="/templates/single.html"
  data-templateList="/templates/list.html"
  data-templateFilters="/templates/filters.html"
  data-feed="http://www.json-generator.com/api/json/get/bZaGvEKgia?indent=2">
    <p>Alternative content</p>
  </div>

<script>
  // Initilaize the map view,
  // the argument is a jQuery selector which must point to an unique node
  var map = new LunrGmap('#map-view');
</script>
```

## Options

| Attribute                 | Description                                               | default |
| ---------                 | --------------------------------------------------------- | -------:|
| `data-feed`*              | the feed url                                              |         |
| `data-latitude`*          | Latitude of the map center                                |         |
| `data-longitude`*         | Longitude of the map center                               |         |
| `data-zoom`               | Initial zoom                                              | 4       |
| `data-templateSingle`*    | Path to the template used to display a marker data        |         |
| `data-filter`*            | the field use to build the filter navigation              |         |
| `data-templateFilters`*   | Path to the template used to build the filter navigation  |         |
| `data-lunr`*              | field|weight use by lunr to crawl the feed                |         |
| `data-templateList`*      | Path to the template used to display search results       |         |

## Contributing

lunr-gmap is made with [coffeescript](http://coffeescript.org/) and [coffeeify](https://github.com/jnordberg/coffeeify). To compile the coffee sources you'll need [node](http://nodejs.org/). To run the example you may use [bower](http://bower.io) to get the dependencies.

With node installed here the few commands you'll need to run :

```bash
git clone git@github.com:Plou/lunr-gmap.git
cd lunr-gmap
npm install
bower install
grunt
```

Two grunt tasks are available :
  - `grunt default` will coffeeify the sources, and watch and serve the files with browsersync.
  - `grunt build` will coffeeify the sources and uglify the result.
