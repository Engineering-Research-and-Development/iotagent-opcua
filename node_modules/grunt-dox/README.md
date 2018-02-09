# grunt-dox

Dox grunt plugin to automatically generate documentation for you project. Currently generates HTML output using [dox-foundaiton](https://github.com/punkave/dox-foundation)

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-dox --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-dox');
```

## Documentation
Inside of your grunt file, add:
```javascript
dox: {
  options: {
    title: "My Library's awesome documentation"
  },
  files: {
    src: ['js/lib/'],
    dest: 'docs'
  }
},
```

This will run all of your files in `lib` through dox and dox-foundation and  put the output in `docs`.

Since the `grunt-dox` task is a multi task, you can create several tasks for dox:

```js
dox: {
  libdocs :{
    files: {
      src: ['js/lib/'],
      dest: 'docs'
    }
  },
  sourcedocs :{
    files: {
      src: ['js/src/'],
      dest: 'docs'
    }
  }
},
```

To ignore certain directories, or to override the default ignore list, simpy add ignore and an array of paths. Note that this is the same as passing the `--ignore` parameter as described on the [dox-foundation docs](https://github.com/punkave/dox-foundation/blob/master/README.md):

```
--ignore <directories>  Comma seperated list of directories to ignore. Overrides default of test, public, static, views, templates
```

Usage:

```js
dox: {
  options: {
    title: 'Ignore Nothing for my awesome documentation'
  },
  files: {
    ignore: ['test'],
    src: ['js/src/'],
    dest: 'docs'
  }
}
```

**Note:** This will completely delete and recreate the docs folder

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
* **0.3.2** *2013-03-20*: 
** Grunt v0.4 support
** Ability to pass options.title to dox-foundation
* **0.3.0**: Now relies solely on folder parsing done by dox-foundation v0.4
* **0.2.0**: Pass multiple files at once. Use dox-foundation for html output
* **0.1.0**: Initial release

## License
Copyright (c) 2012 P'unk Ave
Licensed under the MIT license.
