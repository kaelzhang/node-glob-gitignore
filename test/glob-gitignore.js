import test from 'ava'
import {
  sync
} from '..'

import path from 'path'

const fixture = filepath => path.join(__dirname, 'fixtures', filepath)

test('sync', t => {
  const cwd = fixture('a')
  const found = sync('**', {
    cwd,
    ignore: [
      '*.js',
      '!b.js'
    ]
  })

  t.deepEqual(found, ['b.js'])
})
