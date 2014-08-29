module.exports =
  html:
    files:[
      '*.html'
      'templates/*.html'
    ]

  css:
    files:'*.css'

  coffee:
    files: '<%= in8.jsSrc %>/*.coffee'
    tasks: [
      'coffeeify:dev'
    ]
