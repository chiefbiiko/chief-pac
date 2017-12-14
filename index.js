#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var stream = require('stream')
var pump = require('pump')

var readme = require('./stash/readme')
var license = require('./stash/license')
var ignore = require('./stash/ignore')
var travis = require('./stash/travis')
var appveyor = require('./stash/appveyor')
var test = require('./stash/test')

function readable (buf) {
  var r = new stream.Readable()
  r.push(buf)
  r.push(null)
  return r
}

function replaceOF (stryng, find, repl) {
  var x = stryng.replace(find, repl)
  return x !== stryng ? x : ''
}

var help =
'usage: chief-pac [dir] [-user=xyz] [-force]\n' +
'  dir:   directory, default cwd\n' +
'  -user: set username to write to docs\n' +
'  -force: overwrite existing files?'

var wantsHelp = process.argv.slice(2).some(function (arg) {
  return /-h(elp)?/i.test(arg)
})

var line = process.argv.slice(2).join(' ')
var dir = process.argv.slice(2).reduceRight(function (acc, arg) {
  return !/[-=]/.test(arg) ? arg : acc
}, '')
var dirpath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
var dirname = dirpath.replace(/^.+(\/|\\)(.*)$/, '$2')
var username = replaceOF(line, /^.*user(name)?=([^ ]+).*$/, '$2')
var force = /-f(orce)?(?!=false)/i.test(line)

var readme2 = path.join(dirpath, 'readme.md')
var license2 = path.join(dirpath, 'license.md')
var ignore2 = path.join(dirpath, '.gitignore')
var travis2 = path.join(dirpath, '.travis.yml')
var appveyor2 = path.join(dirpath, 'appveyor.yml')
var test2 = path.join(dirpath, 'test.js')

var pending = 0
var loggedDone = false

function onWritten (err) {
  if (err) throw err
  if (!--pending) console.log('done setting up ' + dirpath)
  loggedDone = true
}

function onReady (err) {
  if (err) throw err

  if (force || !fs.existsSync(readme2)) {
    pending++
    var custom = readable(
      readme.replace(/chiefbiiko/g, username || 'chiefbiiko')
        .replace(/fraud/g, dirname)
    )
    pump(custom, fs.createWriteStream(readme2), onWritten)
  }

  if (force || !fs.existsSync(license2)) {
    pending++
    var current = readable(
      license.replace(/20\d\d/, new Date().getFullYear())
        .replace('Noah Anabiik Schwarz', username || 'Noah Anabiik Schwarz')
    )
    pump(current, fs.createWriteStream(license2), onWritten)
  }

  if (force || !fs.existsSync(ignore2)) {
    pending++
    pump(readable(ignore), fs.createWriteStream(ignore2), onWritten)
  }

  if (force || !fs.existsSync(travis2)) {
    pending++
    pump(readable(travis), fs.createWriteStream(travis2), onWritten)
  }

  if (force || !fs.existsSync(appveyor2)) {
    pending++
    pump(readable(appveyor), fs.createWriteStream(appveyor2), onWritten)
  }

  if (force ||
      (!fs.existsSync(path.join(dirpath, 'test.js')) &&
       !fs.existsSync(path.join(dirpath, 'test')))) {
    pending++
    pump(readable(test), fs.createWriteStream(test2), onWritten)
  }

}

process.on('exit', function () {
  if (!loggedDone && !wantsHelp) console.log('done setting up ' + dirpath)
})

if (wantsHelp) console.log(help)
else if (fs.existsSync(dirpath)) onReady(null)
else fs.mkdir(dirpath, onReady)
