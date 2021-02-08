import { SUCCESS } from '../behavior.js'

export default function set_target(node, state) {
  const target = state.blackboard[node.getAttribute('input')]
  return {
    status: SUCCESS,
    state: {
      ...state,
      target,
    },
  }
}
