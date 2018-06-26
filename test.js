var child = require('child_process')
var fs = require('fs')
var del = require('del')
var tape = require('tape')

var testDir = 'testDir'

fs.mkdirSync(testDir)

tape.onFinish(del.sync.bind(null, testDir))

tape('files are written to designated dir', function (t) {

  child.execSync('node cli ' + testDir)

  t.is(fs.readdirSync(testDir).length, 7, 'files should have been written')

  t.end()
})
