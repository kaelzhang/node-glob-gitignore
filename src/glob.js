import {
  Glob
} from 'glob'

import inherits from 'util.inherits'
import {
  IGNORE,
  createShouldIgnore
} from './util'


// Subclass of `glob.GlobSync`
// @param {string}     pattern      Pattern to be matched.
// @param {Object}     options      `options` for `glob`
// @param {function()} shouldIgnore Method to check whether a directory should be ignored.
// @constructor
function _Glob (patterns, options, callback, shouldIgnore) {

  // We don't put this thing to argument `options` to avoid
  // further problems, such as `options` validation.

  // Use `Symbol` as much as possible to avoid confliction.
  this[IGNORE] = shouldIgnore
  Glob.call(this, patterns, options, callback)
}

inherits(_Glob, Glob)


_Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  const marked = this._mark(abs)

  if (this[IGNORE] && this[IGNORE](marked)) {
    return cb()
  }

  return Glob.prototype._readdir.call(this, abs, inGlobStar, cb)
}


export function glob (patterns, options = {}, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  if (options.sync) {
    if (cb) {
      throw new TypeError('callback provided to sync glob')
    }

    return sync(patterns, options)
  }

  const {
    ignore,
    filter,
    opts
  } = createShouldIgnore(options)

  if (callback) {
    return new _Glob(patterns, opts, (err, files) => {
      if (err) {
        return callback(err)
      }

      callback(null, files.filter(filter))

    }, ignore)
  }

  return new Promise((resolve, reject) => {
    new _Glob(patterns, opts, (err, files) => {
      if (err) {
        return reject(err)
      }

      resolve(files.filter(filter))
    }, ignore)
  })
}
