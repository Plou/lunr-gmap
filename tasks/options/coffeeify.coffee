module.exports =
  dev:
    options:
      debug: true
    src: [
      'src/lunr-gmap.coffee'
    ]
    dest: 'lunr-gmap.js'

  prod:
    options:
      debug: false
    src: [
      'src/lunr-gmap.coffee'
    ]
    dest: 'lunr-gmap.js'
