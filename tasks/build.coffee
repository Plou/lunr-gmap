module.exports = (grunt)->
  grunt.registerTask 'build', [
    'coffeeify:prod'
    'uglify'
  ]
