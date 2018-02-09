# grunt-gjslint

> Validate files with Google Linter.

## Getting Started
This plugin requires Node `~0.8.19` (for managing [peerDependencies](http://blog.nodejs.org/2013/02/07/peer-dependencies/)), Grunt `~0.4.1` and *just* python2 installed.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-gjslint --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-gjslint');
```

## The `gjslint` and `fixjsstyle` tasks
Run this tasks with the `grunt gjslint` or `grunt fixjsstyle` commands.

### Overview
In your project's Gruntfile, add sections named `gjslint` and `fixjsstyle` to the data object passed into `grunt.initConfig()`. Some of the flags passed to gjslint don't work with fixjsstyle.

```js
grunt.initConfig({
  gjslint: {
    options: {
      flags: [
        '--disable 220', //ignore error code 220 from gjslint,
        '--flagfile .gjslintrc' //use flag file
      ],
      reporter: {
        name: 'console' //report to console
      },
      force: false, //don't fail if python is not installed on the computer. Default: `true` 
      pythonPath: '/your/path/to/python2' //closure-linter only works with python2. Specify the path to it. Default: `python` 
    },
    lib: {  //specify your targets, grunt style.
      src: ['lib/module/**/*.js', 'lib/foo.js'],
    },
    test: {
      src: '<%= jshint.test %>',
    }
  },
  fixjsstyle: {
    options: {
      flags: [
        '--disable 220' //ignore error code 220 from gjslint
      ],
      reporter: {
        name: 'console'
      }
    },
    all: {
      src: '<%= jshint.all %>'
    }
  }
})
```

As this is a Multitask, you can specify several targets to be called sharing the same root options

### Documentation
grunt-gjslint uses [node-closure-linter-wrapper](https://github.com/jmendiara/node-closure-linter-wrapper)
to lint files

Please, refer to [node-closure-linter-wrapper documentation](https://github.com/jmendiara/node-closure-linter-wrapper)
for `flags`, `reporter` and `pythonPath` reference.

`options.force` flag is a custom option that when disabled, will not fail the grunt task when python is not installed on
the computer. It defaults to `true`

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* v0.1.6: Huge amount of files in windows support. @ganxiyun 
* v0.1.5: added fixjsstyle task
* v0.1.4: bug fixing in filenames with whitespaces. Thanks to @moelders
* v0.1.3: bug fixing. Thanks to @dcantelar
* v0.1.0: First version

