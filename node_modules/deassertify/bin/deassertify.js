#!/usr/bin/env node
var fs = require("fs")
, path = require("path")
, deassertify = require("../")
, argv = require("minimist")(process.argv.slice(2))
, file = argv._[0]

if (argv.h || argv.help) {
    return fs.createReadStream(path.join(__dirname, "usage.txt")).pipe(process.stdout)
}

var rs = null

if (file && file != "-") {
  rs = fs.createReadStream(file)
} else {
  rs = process.stdin
  file = path.join(process.cwd(), "-")
}

rs.pipe(deassertify(file, argv)).pipe(process.stdout)
