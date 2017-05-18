import {
  Glob
} from 'glob'

import inherits from 'util.inherits'









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

  if (callback) {
    return new _Glob(patterns, options, callback)
  }

  return new Promise((resolve, reject) => {
    new _Glob(patterns, options, (err, files) => {
      if (err) {
        return reject(err)
      }

      resolve(files)
    })
  })
}


export function sync (patterns, options) {

}
