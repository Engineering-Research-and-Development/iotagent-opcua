/*
 * grunt-github-pages
 * https://github.com/thanpolas/grunt-github-pages
 *
 * Copyright (c) 2013 Thanasis Polychronakis
 * Licensed under the MIT license.
 */

var exec = require('child_process').exec;
var path = require('path');
var async = require('async');

module.exports = function(grunt) {

  var _ = grunt.util._;

  // Please see the grunt documentation for more information regarding task
  // creation: https://github.com/gruntjs/grunt/blob/devel/docs/toc.md

  grunt.registerMultiTask('githubPages', function() {
    var done = this.async();

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      commitMessage: 'auto commit',
      remote: 'origin',
      pushBranch: 'gh-pages'
    });

    var fileObj = this.files.shift();


    var src = grunt.file.expand({
      nonull: true,
      filter: 'isDirectory'
      }, fileObj.src);


    if (0 === src.length) {
      grunt.fail.warn('No source directory was provided');
      done(false);
      return;
    }

    var cwd = src[0];
    if ( _.isString(fileObj.dest)) {
      // a destination warrants a copy operation
      var sources = grunt.file.expand({filter: 'isFile'}, src[0] + '/**');
      var dest;
      sources.forEach(function(srcFile) {
        dest = path.relative(src[0], srcFile);
        dest = path.join(fileObj.dest, dest);
        grunt.log.writeln('Copying ' + srcFile.yellow + ' -> ' + dest.cyan);

        grunt.file.copy(srcFile, dest);
      });

      cwd = fileObj.dest;
    }

    grunt.file.setBase(cwd);

    grunt.log.writeln('Changed working directory to: ' + cwd.blue);

    async.series([
      run('git add -A .', done),
      run('git commit -am "' + options.commitMessage + '"', done),
      run('git push ' + options.remote + ' ' + options.pushBranch, done)
    ],
    done);
  });

  var run = function(cmd, done) {
    return function(callback){
      grunt.log.writeln('Executing: ' + cmd.blue);
      var cp = exec(cmd, function (err, stdout, stderr) {
        if (err) {
          grunt.fail.warn(err);
          done(false);
          callback(err);
          return;
        }
        callback();
      });
      cp.stdout.pipe(process.stdout);
    };
  };
};