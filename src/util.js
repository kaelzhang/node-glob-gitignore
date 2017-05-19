export const IGNORE = typeof Symbol === 'function'
  ? Symbol('ignore')
  : '_shouldIgnore'


import ignore from 'ignore'
import path from 'path'
import difference from 'lodash.difference'
import union from 'lodash.union'
import make_array from 'make-array'

function relative (abs, cwd) {
  return path.relative(cwd, abs)
}

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

  if (typeof ignores === 'function') {
    return ignores
  }

  const ig = ignore().add(ignores)
  const filter = ig.createFilter()

  return {
    ignore: filepath => {
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
const isString = subject => typeof subject === 'string'

export const createTasks = (patterns, options) => {
  patterns = make_array(patterns)

  if (!patterns.length || !patterns.every(isString)) {
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
    ignore
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
      ignore
    }
  }

  return {
    join (fileGroups) {
      const positives = []
      const negatives = []

      fileGroups.forEach((files, i) => {
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
