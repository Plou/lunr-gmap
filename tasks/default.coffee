module.exports = (grunt)->
  grunt.registerTask 'default', [
    'coffeeify:dev'
    'browserSync'
    'watch'
  ]
