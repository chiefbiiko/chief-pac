module.exports =
'environment:\n' +
'  matrix:\n' +
'    - nodejs_version: "8"\n' +
'install:\n' +
'  - ps: Install-Product node $env:nodejs_version\n' +
'  - set CI=true\n' +
'  - npm install --global npm@latest\n' +
'  - set PATH=%APPDATA%\npm;%PATH%\n' +
'  - npm install\n' +
'matrix:\n' +
'  fast_finish: true\n' +
'build: off\n' +
'shallow_clone: true\n' +
'test_script:\n' +
'  - node --version\n' +
'  - npm --version\n' +
'  - npm test\n'
