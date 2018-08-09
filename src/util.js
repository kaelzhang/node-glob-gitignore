const ignore = require('ignore')
const path = require('path')
const difference = require('lodash.difference')
const union = require('lodash.union')
const make_array = require('make-array')

const IGNORE = typeof Symbol === 'function'
  ? Symbol('ignore')
  : '_shouldIgnore'

const relative = (abs, cwd) => path.relative(cwd, abs)

const createShouldIgnore = options => {
  const opts = Object.assign({
    cache: Object.create(null),
    statCache: Object.create(null),
    realpathCache: Object.create(null),
    symlinks: Object.create(null)
  }, options)

  const {
    ignore: ignores,
    cwd = process.cwd()
  } = opts

  delete opts.ignore

  if (!ignores) {
    return {
      ignore: () => false,
      filter: () => true,
      opts
    }
  }

  const ig = ignore().add(ignores)
  const filter = ig.createFilter()

  return {
    ignores: filepath => {
      filepath = relative(filepath, cwd)
      if (!filepath) {
        return false
      }

      return !filter(filepath)
    },

    filter,
    opts
  }
}

const isNegative = pattern => pattern[0] === '!'
const isPattern = subject => subject && typeof subject === 'string'

const createTasks = (patterns, options) => {
  patterns = make_array(patterns)

  if (!patterns.length || !patterns.every(isPattern)) {
    throw new TypeError('patterns must be a string or an array of strings')
  }

  const negativeFlags = []
  let positivesCount = 0
  patterns = patterns.map((pattern, i) => {
    if (isNegative(pattern)) {
      negativeFlags[i] = true
      return pattern.slice(1)
    }

    positivesCount ++
    return pattern
  })

  // or only provide a negative pattern
  if (positivesCount === 0) {
    return {
      result: []
    }
  }

  const {
    opts,
    filter,
    ignores
  } = createShouldIgnore(options)

  // Only one positive pattern
  if (positivesCount === 1) {
    return {
      join ([files]) {
        // _GlobSync only filters _readdir, so glob results should be filtered again.
        return files.filter(filter)
      },

      patterns,
      opts,
      ignores
    }
  }

  return {
    join (fileGroups) {
      const positives = []
      const negatives = []

      fileGroups.forEach((files, i) => {
        /* eslint no-unused-expressions: 'off' */
        negativeFlags[i]
          ? negatives.push(files)
          : positives.push(files)
      })

      return difference(union(...positives), ...negatives)
      .filter(filter)
    },

    patterns,
    opts,
    ignore
  }
}

module.exports = {
  IGNORE,
  createTasks
}
