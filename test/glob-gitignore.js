import test from 'ava'
import {
  glob,
  sync
} from '../src'

import vanilla from 'glob'
import ignore from 'ignore'

import path from 'path'

const fixture = (filepath = '') => path.join(__dirname, 'fixtures', filepath)

const CASES = [
{
  d: 'basic',
  p: '**/*.js',
  i: 'a.js',
  r: ['b.js', 'a/b.js', 'a/a/b.js', 'a/a/a/b.js']
},
{
  d: 'patterns',
  p: ['*.js', 'a/*.js'],
  i: ['b.js'],
  r: ['a.js', 'a/a.js']
},
{
  d: 'patterns with negatives',
  p: ['*.js', 'a/**/*.js', '!a/a/a/*.js', '!a/a/*.js'],
  i: ['b.js'],
  r: ['a.js', 'a/a.js']
}
]

process.chdir(fixture())

const RUNNER = {
  glob (patterns, i) {
    return glob(patterns, {ignore: i})
  },

  sync (patterns, i) {
    try {
      return Promise.resolve(sync(patterns, {ignore: i}))
    } catch (e) {
      return Promise.reject(e)
    }
  }
}


CASES.forEach(({
  // description
  d,
  // patterns
  p,
  // ignore
  i,
  // result
  r,
  // error
  e,
  // only
  o
}) => {

  ['glob', 'sync'].forEach(type => {
    const _test = o === true
      ? test.only
      : o === type
        ? test.only
        : test

    _test(`${type}: ${d}`, t => {
      return RUNNER[type](p, i)
      .then(
        files => {
          if (e) {
            t.fail('error expected')
            return
          }

          t.deepEqual(files.sort(), r.sort(), 'fails to compare expected')

          // Only race for string pattern.
          if (typeof p !== 'string') {
            return
          }

          return new Promise((resolve, reject) => {
            vanilla(p, (err, f) => {
              if (err) {
                return reject(err)
              }

              const filter = ignore().add(i).createFilter()

              t.deepEqual(files.sort(), f.filter(filter).sort(), 'race with node-glob')
              resolve()
            })
          })
        },

        err => {
          if (!e) {
            t.fail('should not fail')
            console.error(err)
          }

          t.is(err.message, e)
        }
      )
    })
  })
})
