import { on } from 'events'

import { aiter } from 'iterator-helper'

import logger from '../logger.js'

const log = logger(import.meta)

export function reduce_deal_damage(state, { type, payload }) {
  if (type === 'deal_damage') {
    const { damage, damager } = payload
    const health = Math.max(0, state.health - damage)

    log.info({ damage, health }, 'Deal Damage')

    return {
      ...state,
      last_damager: damager,
      health,
    }
  }
  return state
}

export function deal_damage({ client, world }) {
  client.on('use_entity', ({ target, mouse, sneaking }) => {
    const left_click = 1
    if (mouse === left_click) {
      const mob = world.mobs.by_entity_id(target)
      if (mob) {
        mob.dispatch('deal_damage', {
          damage: 1,
          damager: client.uuid,
        })
      }
    }
  })

  for (const mob of world.mobs.all) {
    aiter(on(mob.events, 'state')).reduce((last_health, [{ health }]) => {
      if (last_health !== health) {
        client.write('entity_status', {
          entityId: mob.entity_id,
          entityStatus: health > 0 ? 2 : 3, // Hurt Animation and Hurt Sound (sound not working)
        })
      }
      return health
    }, null)
  }
}