'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const path = require('path')
const fs = require('fs')
const dotProp = require('dot-prop')
const tempWrite = require('temp-write')
const mosInit = require('.')

const originalArgv = process.argv.slice()
const get = dotProp.get

function run (pkg) {
  const filepath = tempWrite.sync(JSON.stringify(pkg), 'package.json')

  return mosInit({
    cwd: path.dirname(filepath),
    skipInstall: true,
  }).then(() => JSON.parse(fs.readFileSync(filepath, 'utf8')))
}

describe('mos-init', () => {
  it('empty package.json', () => {
    process.argv = ['mos', '--init']
    return run({}).then(pkg => {
      expect(get(pkg, 'scripts.test')).to.eq('mos')
    })
  })

  it('has scripts', () => {
    process.argv = ['mos', '--init']
    return run({
      scripts: {
        start: '',
      },
    }).then(pkg => {
      expect(get(pkg, 'scripts.test'), 'mos')
    })
  })

  it('has default test', () => {
    process.argv = ['mos', '--init']
    return run({
      scripts: {
        test: 'echo "Error: no test specified" && exit 1',
      },
    }).then(pkg => {
      expect(get(pkg, 'scripts.test'), 'mos')
    })
  })

  it('has only mos', () => {
    process.argv = ['mos', '--init']
    return run({
      scripts: {
        test: 'mos',
      },
    }).then(pkg => {
      expect(get(pkg, 'scripts.test')).to.eq('mos')
    })
  })

  it('has test', () => {
    process.argv = ['mos', '--init']
    return run({
      scripts: {
        test: 'foo',
      },
    }).then(pkg => {
      expect(get(pkg, 'scripts.test')).to.eq('foo && mos')
    })
  })

  it('has cli args', () => {
    process.argv = ['mos', '--init', '--foo']

    return run({
      scripts: {
        start: '',
      },
    }).then(pkg => {
      process.argv = originalArgv
      expect(get(pkg, 'scripts.test')).to.eq('mos --foo')
    })
  })

  it('has cli args and existing binary', () => {
    process.argv = ['mos', '--init', '--foo', '--bar']

    return run({
      scripts: {
        test: 'foo',
      },
    }).then(pkg => {
      process.argv = originalArgv
      expect(get(pkg, 'scripts.test')).to.eq('foo && mos --foo --bar')
    })
  })

  it('installs the mos dependency', function () {
    this.timeout(12e4)
    const filepath = tempWrite.sync(JSON.stringify({}), 'package.json')

    return mosInit({
      cwd: path.dirname(filepath),
    }).then(() => {
      expect(get(JSON.parse(fs.readFileSync(filepath, 'utf8')), 'devDependencies.mos')).to.be.truthy
    })
  })
})
