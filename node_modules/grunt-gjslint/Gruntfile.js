/*
 * grunt-gjslint
 * https://github.com/jmendiara/grunt-gjslint
 *
 * Copyright (c) 2013 Javier Mendiara Cañardo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Configuration to be run (and then tested).
    gjslint: {
      options: {
        flags: [
          '--flagfile .gjslintrc'
        ],
        reporter: {
          name: 'console'
        },
        force: true
      },
      all: {
        src: '<%= jshint.all %>'
      }
    },
    fixjsstyle: {
      options: {
        flags: [
          '--flagfile .fixjsstylerc'
        ],
        reporter: {
          name: 'console'
        },
        force: true
      },
      all: {
        src: '<%= jshint.all %>'
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-release');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['gjslint', 'jshint']);

};
