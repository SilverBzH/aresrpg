import { Node } from 'xmldom/lib/dom.js'

import { sequence, reactive_sequence } from './behavior/sequence.js'
import get_biggest_damager from './behavior/damager.js'
import set_target from './behavior/set_target.js'

const nodes = {
  sequence,
  'reactive-sequence': reactive_sequence,
  get_biggest_damager,
  set_target,
}

export const SUCCESS = Symbol('SUCCESS')
export const RUNNING = Symbol('RUNNING')
export const FAILURE = Symbol('FAILURE')

export default async function run(node, state, context) {
  console.log('Run', node.tagName, state)
  return await nodes[node.tagName](node, state, {
    ...context,
    path: `${context.path}.${node.tagName}`,
  })
}

export function childs(node) {
  return Array.from(node.childNodes).filter(
    (child) => child.nodeType === Node.ELEMENT_NODE
  )
}
