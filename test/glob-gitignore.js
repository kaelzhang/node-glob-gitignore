import test from 'ava'
import {
  glob,
  sync
} from '../src'

import path from 'path'

const fixture = filepath => path.join(__dirname, 'fixtures', filepath)

test('sync', t => {
  const cwd = fixture('a')
  const found = sync('**', {
    cwd,
    ignore: [
      'a',
      '*.js',
      '!b.js'
    ]
  })

  t.deepEqual(found, ['b.js'])
})


test('glob', async t => {
  const cwd = fixture('a')
  const found = await glob('**', {
    cwd,
    ignore: [
      'a',
      '*.js',
      '!b.js'
    ]
  })

  t.deepEqual(found, ['b.js'])
})
