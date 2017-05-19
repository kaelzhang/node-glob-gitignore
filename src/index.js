export {
  sync
} from './sync'

export {
  glob
} from './glob'


import glob from 'glob'
import make_array from 'make-array'

export const hasMagic = (patterns, options) =>
  make_array(patterns)
  .some(pattern => glob.hasMagic(pattern, options))
