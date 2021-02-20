import { PassThrough } from 'stream'
import { EventEmitter } from 'events'

import { aiter } from 'iterator-helper'

import { reduce_goto } from './mobs/goto.js'
import { reduce_deal_damage } from './mobs/fight.js'
import { reduce_target_position } from './mobs/target.js'
import { last_event_value } from './events.js'
import { path_end } from './mobs/path.js'
import reduce_behavior_tree from './mobs/behavior_tree.js'

function reduce_state(state, action, world) {
  return [
    //
    reduce_goto,
    reduce_deal_damage,
    reduce_target_position,
    reduce_behavior_tree,
  ].reduce(
    async (intermediate, fn) => fn(await intermediate, action, world),
    state
  )
}

function observe_mobs(mobs) {
  path_end(mobs)
}

export function register_mobs(world) {
  const mobs = world.mobs.map(({ position, mob, level }, i) => {
    const initial_state = {
      path: [position],
      open: [],
      closed: [],
      start_time: 0,
      speed: 500 /* ms/block */,
      health: 20 /* halfheart */,
      blackboard: {},
    }

    const actions = new PassThrough({ objectMode: true })
    const events = new EventEmitter()

    const entity_id = world.next_entity_id + i

    aiter(actions).reduce(async (last_state, action) => {
      const state = await reduce_state(last_state, action, {
        world: world.get(),
        entity_id,
      })
      events.emit('state', state)
      return state
    }, initial_state)

    setImmediate(() => events.emit('state', initial_state))

    return {
      entity_id,
      mob,
      level,
      events,
      get_state: last_event_value(events, 'state'),
      dispatch(type, payload, time = Date.now()) {
        actions.write({ type, payload, time })
      },
    }
  })

  observe_mobs(mobs)

  const { next_entity_id } = world

  return {
    ...world,
    next_entity_id: next_entity_id + mobs.length,
    mobs: {
      all: mobs,
      by_entity_id(id) {
        if (id >= next_entity_id && id <= next_entity_id + mobs.length)
          return mobs[id - next_entity_id]
        else return null
      },
    },
  }
}
