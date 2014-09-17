module.exports =
  options:
    banner: '/*! uglified <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */'
  build:
    files: [{
      expand: true,
      cwd: '<%= in8.jsDest %>',
      src: 'lunr-gmap.js',
      dest: '<%= in8.jsDest %>'
      ext: '.min.js'
    }]
