#!/usr/bin/env node

// TODO: use minimist!!

var fs = require('fs')
var path = require('path')
var stream = require('stream')
var pump = require('pump')

var readme = require('./stash/readme.js')
var license = require('./stash/license.js')
var git = require('./stash/ignore.js')
var travis = require('./stash/travis.js')
var appveyor = require('./stash/appveyor.js')
var test = require('./stash/test.js')
var security = require('./stash/security.js')

var help =
'usage: chief-pac [dir] [github=xyz] [name=xyz] [-force]\n' +
'       chief-pac set github=xyz|name=abc\n\n' +
'  dir: directory, default cwd\n' +
'  name: your real name\n' +
'  github: your name on github\n' +
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
var github = replaceOF(line, /^.*github=([^\s]+).*$/, '$2')
var name = replaceOF(line, /^.*name=([^\s]+).*$/, '$2')
var force = /-f(orce)?(?!=false)/i.test(line)

var config = path.join(__dirname, '.config')
var readme2 = path.join(dirpath, 'readme.md')
var license2 = path.join(dirpath, 'license.md')
var git2 = path.join(dirpath, '.gitignore')
var travis2 = path.join(dirpath, '.travis.yml')
var appveyor2 = path.join(dirpath, 'appveyor.yml')
var test2 = path.join(dirpath, 'test.js')
var security2 = path.join(dirpath, 'security.md')

var pending = 0
var loggedDone = false
var justSet = false

function loadConfig (err) {
  if (err) throw err
  fs.readFile(config, function (err, buf) {
    if (err) throw err
    var env = JSON.parse(buf)
      github = env.github
      name = env.name
      onReady(null)
  })
}

function readable (buf) {
  var r = new stream.Readable()
  r.push(buf)
  r.push(null)
  return r
}

function write (data, to) {
  if (force || !fs.existsSync(to)) {
    pending++
    pump(readable(data), fs.createWriteStream(to), onWritten)
  }
}

function replaceOF (str, find, repl) {
  var x = str.replace(find, repl)
  return x !== str ? x : ''
}

function thrower (err) {
  if (err) throw err
}

function onWritten (err) {
  if (err) throw err
  if (!--pending) console.log('done setting up ' + dirpath)
  loggedDone = true
}

function onReady (err) {
  if (err) throw err

  var customReadme = readme
    .replace(/chiefbiiko/g, github || 'chiefbiiko')
    .replace(/fraud/g, dirname)

  var customLicense = license
    .replace(/20\d\d/, new Date().getFullYear())
    .replace('Noah Anabiik Schwarz', name || 'Noah Anabiik Schwarz')

  write(customReadme, readme2)
  write(customLicense, license2)
  write(git, git2)
  write(travis, travis2)
  write(appveyor, appveyor2)
  write(test, test2)
  write(security, security2)
}

if (wantsHelp) return console.log(help)

if (/set (github)|(real)=.+/i.test(line)) {
  justSet = true
  var which = replaceOF(line, /^.*set (.*)=.*$/i, '$1') || 'github'
  var user = replaceOF(line, /^.*set .*=([^\\n]*)$/i, '$1') || 'noop'
  fs.readFile(config, function (err, buf) {
    if (err) throw err
    var env = JSON.parse(buf)
    env[which] = user
    fs.writeFile(config, JSON.stringify(env), function (err) {
      if (err) throw err
      process.exit(0)
    })
  })
}

if (!github || !name)
  fs.existsSync(dirpath) ? loadConfig(null) : fs.mkdir(dirpath, loadConfig)
else if (!fs.existsSync(dirpath))
  fs.mkdir(dirpath, onReady)
else
  onReady(null)

process.on('exit', function () {
  if (!loggedDone && !wantsHelp && !justSet) console.log('pacd up ' + dirpath)
})
