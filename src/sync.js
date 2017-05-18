import {
  GlobSync
} from 'glob'

import inherits from 'util.inherits'
import {
  IGNORE,
  createShouldIgnore
} from './util'


function _GlobSync (patterns, options, shouldIgnore) {

  this[IGNORE] = shouldIgnore
  GlobSync.call(this, patterns, options)
}

inherits(_GlobSync, GlobSync)


_GlobSync.prototype._readdir = function (abs, inGlobStar) {

  // `options.nodir` makes `options.mark` as `true`.
  // Mark `abs` first
  // to make sure `'node_modules'` will be ignored immediately with ignore pattern `'node_modules/'`.

  // There is a built-in cache about marked `File.Stat` in `glob`, so that we could not worry about the extra invocation of `this._mark()`
  const marked = this._mark(abs)

  if (this[IGNORE] && this[IGNORE](marked)) {
    return null
  }

  return GlobSync.prototype._readdir.call(this, abs, inGlobStar)
}



export function sync (patterns, options) {

  if (typeof options === 'function' || arguments.length === 3) {
    throw new TypeError(`callback provided to sync glob
See: https://github.com/isaacs/node-glob/issues/167`)
  }

  options = Object.assign({}, options)
  const {
    ignore,
    filter
  } = createShouldIgnore(options.ignore)
  delete options.ignore

  return new _GlobSync(patterns, options, ignore)
  .found
  // _GlobSync only filters _readdir, so glob results should be filtered again.
  .filter(filter)
}
