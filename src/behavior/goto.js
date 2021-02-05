import logger from '../logger.js'
import { block_position } from '../position.js'
import { path_position } from '../mobs/path.js'
import { path_between } from '../mobs/navigation.js'
import { SUCCESS, FAILURE } from '../behavior.js'

const log = logger(import.meta)

export default async function goto(node, { state, time }, { world }) {
  const to = null

  const from = block_position(
    path_position({
      path: state.path,
      start_time: state.start_time,
      speed: state.speed,
      time,
    })
  )

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
