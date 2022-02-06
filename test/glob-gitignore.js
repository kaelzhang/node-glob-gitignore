const test = require('ava')
const vanilla = require('glob')
const ignore = require('ignore')
const path = require('path')

const {
  glob,
  sync,
  hasMagic
} = require('..')

const fixture = (filepath = '') => path.join(__dirname, 'fixtures', filepath)

const CASES = [
  {
    d: 'basic',
    p: '**/*.js',
    i: 'a.js',
    r: ['b.js', 'a/b.js', 'a/a/b.js', 'a/a/a/b.js', 'b/b.js', 'b/b/b.js', 'b/b/b/b.js']
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
    r: ['a.js', 'a/a.js', 'a/a/a.js', 'a/a/a/a.js', 'b/a.js', 'b/b/a.js', 'b/b/b/a.js']
  },
  {
    d: 'only negative',
    p: ['!**/a.js'],
    r: []
  },
  {
    d: 'negative prefixed group',
    p: '!(a)**/*.js',
    r: ['b/b.js', 'b/a.js']
  }
]

const DIR = fixture()
const ABS = f => path.join(DIR, f)

process.chdir(DIR)

const RUNNER = {
  glob (patterns, i, options) {
    return glob(patterns, Object.assign({ignore: i}, options))
  },

  sync (patterns, i, options) {
    try {
      return Promise.resolve(
        sync(patterns, Object.assign({ignore: i}, options))
      )
    } catch (e) {
      return Promise.reject(e)
    }
  },

  options_sync (patterns, i, options) {
    try {
      return Promise.resolve(
        glob(patterns, Object.assign({ignore: i, sync: true}, options))
      )
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

const run = ({
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
  only,
  // options
  o
}, type,

// Extra config
{
  desc = '',
  absolute = false
} = {}) => {
  const _test = only === true
    ? test.only
    : only === type
      ? test.only
      : test

  const extra_desc = desc
    ? `, ${desc}`
    : ''

  const options = absolute
    ? Object.assign({
      absolute: true,
      o
    })
    : o

  _test(`${type}: ${d}${extra_desc}`, t =>
    RUNNER[type](p, i, options)
    .then(
      files => {
        if (e) {
          t.fail('error expected')
          return
        }

        t.deepEqual(
          files.sort(),
          absolute
            ? r.sort().map(ABS)
            : r.sort(),
          'fails to compare expected'
        )

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
            const globbed_files = f.filter(filter).sort()
            const expected = absolute
              ? globbed_files.map(ABS)
              : globbed_files

            t.deepEqual(
              files.sort(),
              expected,
              'race with node-glob'
            )
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
}


CASES.forEach(c => {
  ['glob', 'sync', 'options_sync'].forEach(type => {
    // run(c, type)

    // #5
    run(c, type, {
      desc: 'absolute: true',
      absolute: true
    })
  })
})


test('hasMagic', t => {
  t.is(hasMagic('a/{b/c,x/y}'), true)
  t.is(hasMagic(['a/{b/c,x/y}']), true)
  t.is(hasMagic('a'), false)
})

test('error', t => {
  t.throws(() => {
    glob('', {
      cwd: __dirname
    }, TypeError)
  })
})
