#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var stream = require('stream')
var concat = require('concat-stream')
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

function thrower (err) {
  if (err) throw err
}

var help =
'usage: chief-pac [dir] [githubName=xyz] [realName=xyz] [-force]\n' +
'       chief-pac set githubName=xyz|realName=abc\n\n' +
'  dir: directory, default cwd\n' +
'  name: your real name\n' +
'  github: your name on github\n' +
'  -force: overwrite existing files?'

var wantsHelp = process.argv.slice(2).some(function (arg) {
  return /-h(elp)?/i.test(arg)
})

var config = path.join(__dirname, '.config')

var line = process.argv.slice(2).join(' ')

var dir = process.argv.slice(2).reduceRight(function (acc, arg) {
  return !/[-=]/.test(arg) ? arg : acc
}, '')
var dirpath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
var dirname = dirpath.replace(/^.+(\/|\\)(.*)$/, '$2')
var github = replaceOF(line, /^.*github=([^ ]+).*$/, '$2')
var name = replaceOF(line, /^.*name=([^ ]+).*$/, '$2')
var force = /-f(orce)?(?!=false)/i.test(line)
  console.log('DIRPATH', dirpath)
var readme2 = path.join(dirpath, 'readme.md')
var license2 = path.join(dirpath, 'license.md')
var ignore2 = path.join(dirpath, '.gitignore')
var travis2 = path.join(dirpath, '.travis.yml')
var appveyor2 = path.join(dirpath, 'appveyor.yml')
var test2 = path.join(dirpath, 'test.js')

var pending = 0
var loggedDone = false
var justSet = false

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
      readme.replace(/chiefbiiko/g, github || 'chiefbiiko')
        .replace(/fraud/g, dirname)
    )
    pump(custom, fs.createWriteStream(readme2), onWritten)
  }

  if (force || !fs.existsSync(license2)) {
    pending++
    var current = readable(
      license.replace(/20\d\d/, new Date().getFullYear())
        .replace('Noah Anabiik Schwarz', name || 'Noah Anabiik Schwarz')
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
  if (!loggedDone && !wantsHelp && !justSet)
    console.log('done setting up ' + dirpath)
})

if (wantsHelp) return console.log(help)

if (/set (github)|(real)=.+/i.test(line)) {
  justSet = true
  var which = replaceOF(line, /^.*set (.*)=.*$/i, '$1') || 'github'
  var name = replaceOF(line, /^.*set .*=([^\\n]*)$/i, '$1') || 'noop'
  var setr = concat(function (buf) {
    var custom = buf.toString()
      .replace(RegExp(which + '=[^\\n]*', 'i'), which + '=' + name)
    pump(readable(custom), fs.createWriteStream(config), thrower)
  })
  pump(fs.createReadStream(config), setr, function (err) {
    if (err) throw err
    process.exit(0)
  })
}

if (!github || !name) {
  var getr = concat(function (buf) {
    var env = buf.toString()
    if (!github) github = replaceOF(env, /^.*github=([^\\n]*).*$/i, '$1')
    if (!name) name = replaceOF(env, /^.*name=([^\\n]*).*$/i, '$1')
  })
  pump(fs.createReadStream(config), getr, onReady)
} else if (fs.existsSync(dirpath)) {
  onReady(null)
} else {
  fs.mkdir(dirpath, function (err) {
    if (err) throw err
    seTimeout(function () {
      onReady(null)
    }, 1250)
  })
}
