# chief-pac

[![build status](http://img.shields.io/travis/chiefbiiko/chief-pac.svg?style=flat)](http://travis-ci.org/chiefbiiko/chief-pac) [![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/chief-pac?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/chief-pac)

***

CLI to add plumbing files to a directory instantly: `.gitignore`, `.travis.yml`, `appveyor.yml`, `readme.md`, `license.md`, and a `test.js`.

***

## Get it!

```
npm install -g chief-pac
```

***

## Usage

```
usage: chief-pac [dir] [github=xyz] [name=xyz] [-force]
       chief-pac set github=xyz|name=abc

  dir: directory, default cwd
  name: your real name
  github: your name on github
  -force: overwrite existing files?
```

***

## License

[MIT](./license.md)
