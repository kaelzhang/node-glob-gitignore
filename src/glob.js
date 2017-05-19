import {
  Glob
} from 'glob'

import inherits from 'util.inherits'
import {
  IGNORE,
  createTasks
} from './util'


// Subclass of `glob.GlobSync`
// @param {string}     pattern      Pattern to be matched.
// @param {Object}     options      `options` for `glob`
// @param {function()} shouldIgnore Method to check whether a directory should be ignored.
// @constructor
function _Glob (pattern, options, callback, shouldIgnore) {

  // We don't put this thing to argument `options` to avoid
  // further problems, such as `options` validation.

  // Use `Symbol` as much as possible to avoid confliction.
  this[IGNORE] = shouldIgnore
  Glob.call(this, pattern, options, callback)
}

inherits(_Glob, Glob)


_Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  const marked = this._mark(abs)

  if (this[IGNORE] && this[IGNORE](marked)) {
    return cb()
  }

  return Glob.prototype._readdir.call(this, abs, inGlobStar, cb)
}


function globOne (pattern, opts, ignore) {
  return new Promise((resolve, reject) => {
    new _Glob(pattern, opts, (err, files) => {
      if (err) {
        return reject(err)
      }

      resolve(files)
    }, ignore)
  })
}


export function glob (_patterns, options = {}) {
  if (options.sync) {
    return sync(_patterns, options)
  }

  const {
    patterns,
    ignore,
    join,
    opts,
    result
  } = createTasks(_patterns, options)

  if (result) {
    return Promise.resolve(result)
  }

  return Promise.all(
    patterns.map(pattern => globOne(pattern, opts, ignore))
  )
  .then(join)
}
