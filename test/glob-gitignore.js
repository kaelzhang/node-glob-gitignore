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
}
]

process.chdir(fixture())

const RUNNER = {
  'glob.then' (patterns, i) {
    return glob(patterns, {ignore: i})
  },

  glob (patterns, i) {
    return new Promise((resolve, reject) => {
      glob(patterns, {ignore: i}, (err, files) => {
        if (err) {
          return reject(err)
        }

        resolve(files)
      })
    })
  },

  sync (patterns, i) {
    try {
      return Promise.resolve(sync(patterns, {ignore: i}))
    } catch (e) {
      return Proimse.reject(e)
    }
  }
}


CASES.forEach(({
  d,
  p,
  i,
  r,
  e
}) => {

  ['glob.then', 'glob', 'sync'].forEach(type => {
    test(`${type}: ${d}`, t => {
      return RUNNER[type](p, i)
      .then(
        files => {
          if (e) {
            t.fail('error expected')
            return
          }

          t.deepEqual(files.sort(), r.sort(), 'fails to compare expected')
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
          }

          t.is(err.message, e)
        }
      )
    })
  })
})
