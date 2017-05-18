export const IGNORE = typeof Symbol === 'function'
  ? Symbol('ignore')
  : '_shouldIgnore'


import ignore from 'ignore'
import path from 'path'

function relative (abs, cwd) {
  return path.relative(cwd, abs)
}


export function createShouldIgnore (options) {
  const opts = Object.assign({}, options)

  const {
    ignore: ignores,
    cwd = process.cwd()
  } = opts

  delete opts.ignore

  if (!ignores) {
    return
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
