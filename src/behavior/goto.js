import logger from '../logger.js'
import { block_position, position_equal } from '../position.js'
import { path_position } from '../mobs/path.js'
import { path_between } from '../mobs/navigation.js'
import { SUCCESS, FAILURE, RUNNING } from '../behavior.js'

const log = logger(import.meta)

export default async function goto(node, state, { world, action }) {
  const { time } = action
  const to = block_position(state.blackboard[node.getAttribute('target')])
  const from = block_position(
    path_position({
      path: state.path,
      start_time: state.start_time,
      speed: state.speed,
      time,
    })
  )

  if (position_equal(from, to)) {
    return { result: SUCCESS, state }
  } else if (position_equal(state.path[state.path.length - 1], to)) {
    return { result: RUNNING, state }
  } else {
    const start_time = time

    log.info({ start_time, from, to }, 'Goto Block')

    const { path, open, closed } = await path_between({ world, from, to })

    if (path != null) {
      return {
        status: SUCCESS,
        state: {
          ...state,
          path,
          open,
          closed,
          start_time,
        },
        time: start_time + state.speed * path.length,
      }
    } else {
      return {
        status: FAILURE,
        state,
        time,
      }
    }
  }
}
