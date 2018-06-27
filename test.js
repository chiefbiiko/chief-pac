var child = require('child_process')
var fs = require('fs')
var del = require('del')
var tape = require('tape')

var testDir = 'testDir'

fs.mkdirSync(testDir)

tape.onFinish(del.sync.bind(null, testDir))

tape('files are written to designated dir', function (t) {

  child.execSync('node cli ' + testDir)
 
  var files = fs.readdirSync(testDir)

  t.is(files.length, 7, 'files should have been written')
  t.true([ 
    'appveyor.yml', 
    '.travis.yml', 
    'license.md', 
    'readme.md', 
    'security.md', 
    '.gitignore', 
    'test.js' 
   ].every(function (musthave) {
     return files.includes(musthave)
   }),
   'got all files')

  t.end()
})
