# Command Shell Lib

## Index
* [Overview](#overview)
* [Usage](#usage)
* [Development documentation](#development)

## <a name="overview"/> Overview
The target o this application is to ease the creation of command line interpreters for testing utililities. It makes use of the functionalities of Node.js [Readline library](https://nodejs.org/api/readline.html), adding the following features:
* Configuration layer that let you define your commands and their syntax in a declarative way.
* Automatic parameter number check.
* Free help command
* Script input execution

## <a name="usage"/> Usage

### Library import and usage
In order to use the library, you have to require it, as usual, and initialize it:
```
var clUtils = require('command-node');

[...]

clUtils.initialize(commands, 'App Tester> ');
```
The `initialize()` function receives two parameters:
* The commands object: that defines all the commands available in your interpreter (its structure is described in the next section).
* And the prompt string: that will be used en each line of the interpreter to mark the input line.

### Definition of the Commands object
The library usage is based on the definition of a `commands` object, that is passed in the initialization of the library. This object contains a description of each of the commands you want to be able to execute. E.g.:
```
    commands = {
        'create': {
            parameters: ['objectUri', 'objectValue'],
            description: '\tCreate a new object. The object is specified using the /type/id OMA notation.',
            handler: function() {}
        }
    };
```
This definition includes: 
* **name**: for each command a new attribute is defined in the object. The attribute name will be the name of the command used to execute it in the interpreter.
* **signature**: that is, the parameters the command will receive. In this current version, commands have to have a fixed number of parameters. This parameters will be checked upon command execution, and the command will fail if the number does not match the signature.
* **description** of the command: that will be used to autogenerate the help message for each command.
* **handler**: the name of the function that will handle the command execution. Whenever a this particular command is executed witht the adecuate number of parameters, the handler will be called, passing an array of parameters with the values used in the command execution.

### Other functions

#### prompt()
Shows the prompt in the standard output. It should be used once the command has stopped sending information to the output. You should also remember to use the prompt after showing information asynchronously (like an asynchronous response from a server) to avoid the user entering information in a blank line.

#### destroy()
Closes the resources of the interpreter.

#### notImplemented()
Generic handler showing a "Not Implemented" message, available for developing new commands.

#### setWriter()
Changes the writer object of the interpreter (where the interpreter writes its information). Mostly for testing purposes. An example of use is available in the test files.

## <a name="development"/> Development documentation
### Project build
The project is managed using Grunt Task Runner.

For a list of available task, type
```bash
grunt --help
```

The following sections show the available options in detail.


### Testing
[Mocha](http://visionmedia.github.io/mocha/) Test Runner + [Chai](http://chaijs.com/) Assertion Library + [Sinon](http://sinonjs.org/) Spies, stubs.

The test environment is preconfigured to run [BDD](http://chaijs.com/api/bdd/) testing style with
`chai.expect` and `chai.should()` available globally while executing tests, as well as the [Sinon-Chai](http://chaijs.com/plugins/sinon-chai) plugin.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)

To run tests, type
```bash
grunt test
```

Tests reports can be used together with Jenkins to monitor project quality metrics by means of TAP or XUnit plugins.
To generate TAP report in `report/test/unit_tests.tap`, type
```bash
grunt test-report
```


### Coding guidelines
jshint, gjslint

Uses provided .jshintrc and .gjslintrc flag files. The latter requires Python and its use can be disabled
while creating the project skeleton with grunt-init.
To check source code style, type
```bash
grunt lint
```

Checkstyle reports can be used together with Jenkins to monitor project quality metrics by means of Checkstyle
and Violations plugins.
To generate Checkstyle and JSLint reports under `report/lint/`, type
```bash
grunt lint-report
```


### Continuous testing

Support for continuous testing by modifying a src file or a test.
For continuous testing, type
```bash
grunt watch
```


### Source Code documentation
dox-foundation

Generates HTML documentation under `site/doc/`. It can be used together with jenkins by means of DocLinks plugin.
For compiling source code documentation, type
```bash
grunt doc
```


### Code Coverage
Istanbul

Analizes the code coverage of your tests.

To generate an HTML coverage report under `site/coverage/` and to print out a summary, type
```bash
# Use git-bash on Windows
grunt coverage
```

To generate a Cobertura report in `report/coverage/cobertura-coverage.xml` that can be used together with Jenkins to
monitor project quality metrics by means of Cobertura plugin, type
```bash
# Use git-bash on Windows
grunt coverage-report
```


### Code complexity
Plato

Analizes code complexity using Plato and stores the report under `site/report/`. It can be used together with jenkins
by means of DocLinks plugin.
For complexity report, type
```bash
grunt complexity
```

### PLC

Update the contributors for the project
```bash
grunt contributors
```


### Development environment

Initialize your environment with git hooks.
```bash
grunt init-dev-env 
```

We strongly suggest you to make an automatic execution of this task for every developer simply by adding the following
lines to your `package.json`
```
{
  "scripts": {
     "postinstall": "grunt init-dev-env"
  }
}
``` 


### Site generation

There is a grunt task to generate the GitHub pages of the project, publishing also coverage, complexity and JSDocs pages.
In order to initialize the GitHub pages, use:

```bash
grunt init-pages
```

This will also create a site folder under the root of your repository. This site folder is detached from your repository's
history, and associated to the gh-pages branch, created for publishing. This initialization action should be done only
once in the project history. Once the site has been initialized, publish with the following command:

```bash
grunt site
```

This command will only work after the developer has executed init-dev-env (that's the goal that will create the detached site).

This command will also launch the coverage, doc and complexity task (see in the above sections).

