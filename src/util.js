export const IGNORE = typeof Symbol === 'function'
  ? Symbol('ignore')
  : '_shouldIgnore'


import ignore from 'ignore'

export function createShouldIgnore (ignores) {
  if (!ignores) {
    return
  }

  if (typeof ignores === 'function') {
    return ignores
  }

  const ig = ignore().add(ignores)

  return {
    ignore: filepath => ig.ignores(filepath),
    filter: ig.createFilter()
  }
}
