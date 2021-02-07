import { SUCCESS } from '../behavior'

export default function get_biggest_damager(node, state) {
  return {
    result: SUCCESS,
    state: {
      ...state,
      blackboard: {
        ...state.blackboard,
      },
    },
  }
}
