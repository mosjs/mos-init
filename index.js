'use strict'
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const argv = require('the-argv')
const readPkgUp = require('read-pkg-up')
const writePkg = require('write-pkg')
const arrExclude = require('arr-exclude')
const DEFAULT_TEST_SCRIPT = 'echo "Error: no test specified" && exit 1'

module.exports = function (opts) {
  opts = opts || {}

  const ret = readPkgUp.sync({
    cwd: opts.cwd,
    normalize: false,
  })
  const pkg = ret.pkg || {}
  const pkgPath = ret.path || path.resolve(opts.cwd || '', 'package.json')
  const cli = opts.args || argv()
  const args = arrExclude(cli, ['--init', '--unicorn'])
  const cmd = 'mos' + (args.length > 0 ? ' ' + args.join(' ') : '')
  const s = pkg.scripts = pkg.scripts ? pkg.scripts : {}

  if (s.test && s.test !== DEFAULT_TEST_SCRIPT) {
    s.test = s.test.replace(/\bnode (test\/)?test\.js\b/, cmd)

    if (!/\bmos\b/.test(s.test)) {
      s.test += ' && ' + cmd
    }
  } else {
    s.test = cmd
  }
  s.md = 'mos'
  s['?md'] = 'echo "Update the markdown files"'

  writePkg.sync(pkgPath, pkg)

  const post = function () {
    // for personal use
    if (cli.indexOf('--unicorn') !== -1) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      pkg.devDependencies.mos = '*'
      writePkg.sync(pkgPath, pkg)
    }
  }

  if (opts.skipInstall) {
    post()
    return Promise.resolve()
  }

  const child = childProcess.spawn('npm', ['install', '--save-dev', 'mos'], {
    cwd: path.dirname(pkgPath),
    stdio: 'inherit',
  })

  return new Promise(function (resolve, reject) {
    child.on('error', reject)
    child.on('exit', function (code) {
      if (code) {
        reject(new Error('npm command exited with non-zero exit code'))
      }
      post()
      resolve()
    })
  })
}
