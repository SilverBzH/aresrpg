import { Node } from 'xmldom/lib/dom.js'

import logger from './logger.js'
import { sequence, reactive_sequence } from './behavior/sequence.js'
import get_biggest_damager from './behavior/damager.js'
import set_target from './behavior/set_target.js'
import target_position from './behavior/target_position.js'
import goto from './behavior/goto.js'

const log = logger(import.meta)

const nodes = {
  sequence,
  'reactive-sequence': reactive_sequence,
  get_biggest_damager,
  set_target,
  target_position,
  goto,
}

export const SUCCESS = Symbol('SUCCESS')
export const RUNNING = Symbol('RUNNING')
export const FAILURE = Symbol('FAILURE')

export default async function run(node, state, context) {
  const path = `${context.path}.${node.tagName}`
  const result = await nodes[node.tagName](node, state, {
    ...context,
    path,
  })
  log.info({ path, status: result.status.toString() }, 'Runned')
  return result
}

export function childs(node) {
  return Array.from(node.childNodes).filter(
    (child) => child.nodeType === Node.ELEMENT_NODE
  )
}
