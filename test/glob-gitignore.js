const test = require('ava')
const vanilla = require('glob')
const ignore = require('ignore')
const path = require('path')

const {
  glob,
  sync,
  hasMagic
} = require('../src')

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
  },
  {
    d: 'without ignore',
    p: ['**/a.js'],
    r: ['a.js', 'a/a.js', 'a/a/a.js', 'a/a/a/a.js']
  },
  {
    d: 'only negative',
    p: ['!**/a.js'],
    r: []
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
  },

  options_sync (patterns, i) {
    try {
      return Promise.resolve(glob(patterns, {ignore: i, sync: true}))
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
  ['glob', 'sync', 'options_sync'].forEach(type => {
    const _test = o === true
      ? test.only
      : o === type
        ? test.only
        : test

    _test(`${type}: ${d}`, t =>
      RUNNER[type](p, i)
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
            /* eslint no-console: 'off' */
            console.error(err)
          }

          t.is(err.message, e)
        }
      )
    )
  })
})


test('hasMagic', t => {
  t.is(hasMagic('a/{b/c,x/y}'), true)
  t.is(hasMagic(['a/{b/c,x/y}']), true)
  t.is(hasMagic('a'), false)
})

test('error', async t => {
  t.throws(() => {
    glob('', {
      cwd: __dirname
    }, TypeError)
  })
})
