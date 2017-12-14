#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var stream = require('stream')
var concat = require('concat-stream')
var pump = require('pump')

var readme = require('./stash/readme')
var license = require('./stash/license')
var git = require('./stash/ignore')
var travis = require('./stash/travis')
var appveyor = require('./stash/appveyor')
var test = require('./stash/test')

var help =
'usage: chief-pac [dir] [githubName=xyz] [realName=xyz] [-force]\n' +
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
var git2 = path.join(dirpath, '.gitgit')
var travis2 = path.join(dirpath, '.travis.yml')
var appveyor2 = path.join(dirpath, 'appveyor.yml')
var test2 = path.join(dirpath, 'test.js')

var pending = 0
var loggedDone = false
var justSet = false

function loadConfig (err) {
  if (err) throw err
  var gather = concat(function (buf) {
    var env = JSON.parse(buf)
    github = env.github
    name = env.name
  })
  pump(fs.createReadStream(config), gather, onReady)
}

function readable (buf) {
  var r = new stream.Readable()
  r.push(buf)
  r.push(null)
  return r
}

function copy (data, to) {
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

  if (force || !fs.existsSync(readme2)) {
    pending++
    var custom = readme.replace(/chiefbiiko/g, github || 'chiefbiiko')
      .replace(/fraud/g, dirname)
    pump(readable(custom), fs.createWriteStream(readme2), onWritten)
  }

  if (force || !fs.existsSync(license2)) {
    pending++
    var current = license.replace(/20\d\d/, new Date().getFullYear())
      .replace('Noah Anabiik Schwarz', name || 'Noah Anabiik Schwarz')
    pump(readable(current), fs.createWriteStream(license2), onWritten)
  }

  copy(git, git2)
  copy(travis, travis2)
  copy(appveyor, appveyor2)
  copy(test, test2)

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
