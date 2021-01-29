import { sequence, reactive_sequence } from './behavior/sequence.js'

const nodes = {
  sequence,
  'reactive-sequence': reactive_sequence,
}

export const SUCCESS = Symbol('SUCCESS')
export const RUNNING = Symbol('RUNNING')
export const FAILURE = Symbol('FAILURE')

export default async function run(node, { state, time }, context) {
  return await nodes[node.tagName](
    node,
    {
      state,
      time,
    },
    { ...context, path: `${context.path}.${node.tagName}` }
  )
}
