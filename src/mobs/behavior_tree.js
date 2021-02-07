import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

import { DOMParser } from 'xmldom'

import run from '../behavior'

const tree = new DOMParser().parseFromString(
  fs.readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'test.xml'),
    'utf8'
  ),
  'text/xml'
)

export default function reduce_behavior_tree(state, action, world) {
  const { state: next_state } = run(tree, state, {
    path: 'tree',
    action,
    world,
  })

  return next_state
}
