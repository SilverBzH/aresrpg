import fastify from 'fastify'
import { XMLSerializer } from 'xmldom'

import logger from './logger.js'
import { tree } from './mobs/behavior_tree.js'

const log = logger(import.meta)

function behavior({ world, app }) {
  const serializer = new XMLSerializer()

  const trees = [
    {
      id: 'test',
      tree: serializer.serializeToString(tree),
    },
  ]

  const instances = world.mobs.all.map(({ entity_id: id }) => ({
    id,
    tree: 'test',
  }))

  app.get('/behavior', () => ({ trees, instances }))
}

export default function start_debug_server({ world }) {
  const app = fastify({ logger: log })

  behavior({ world, app })

  app.listen(4242).then((address) => {
    log.info(
      `Arborist https://aresrpg-arborist.netlify.app/${address}/behavior`
    )
  })
}
