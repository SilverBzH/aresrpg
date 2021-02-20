import { PassThrough, Readable } from 'stream'

import fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import { XMLSerializer } from 'xmldom'
import { aiter } from 'iterator-helper'

import logger from './logger.js'
import { tree } from './mobs/behavior_tree.js'
import { Types } from './mobs/types.js'
import { SUCCESS, FAILURE, RUNNING } from './behavior.js'

const log = logger(import.meta)

/**
 * @param {{ app: import('fastify').FastifyInstance }}
 */
function behavior({ world, app }) {
  const serializer = new XMLSerializer()

  const trees = Object.entries(Types).map(([id, { displayName }]) => ({
    id,
    name: displayName,
    tree: serializer.serializeToString(tree),
    instances: world.mobs.all
      .filter(({ mob }) => mob === id)
      .map(({ entity_id }) => ({
        id: entity_id,
      })),
  }))

  app.get('/behavior', () => trees)

  const instances = world.mobs.all.map(({ entity_id }) => ({
    entity_id,
    current: {},
    stream: new PassThrough({ objectMode: true }),
  }))

  app.get('/behavior/:id', (request, reply) => {
    reply.type('text/event-stream')
    reply.header('Connection', 'keep-alive')

    function format(data) {
      return `data: ${JSON.stringify(data)}\n\n`
    }

    const instance = instances.find(
      ({ entity_id }) => entity_id === Number(request.params.id)
    )

    const stream = new PassThrough()

    for (const data of Object.entries(instance.current)) {
      stream.write(format(data))
    }

    Readable.from(
      aiter(instance.stream[Symbol.asyncIterator]()).map(format)
    ).pipe(stream)

    reply.send(stream)
  })

  const statuses = {
    [SUCCESS]: 'SUCCESS',
    [FAILURE]: 'FAILURE',
    [RUNNING]: 'RUNNING',
  }

  return ({ context: { path, entity_id }, result }) => {
    const status = statuses[result.status]

    const instance = instances.find(({ entity_id: id }) => id === entity_id)

    instance.current = {
      ...instance.current,
      [path]: status,
    }

    instance.stream.write([path, status])
  }
}

export default function start_debug_server({ world }) {
  const app = fastify({ logger: log })

  app.register(fastifyCors, {
    origin: true,
  })

  app.listen(4242).then((address) => {
    log.info(
      `Arborist https://aresrpg-arborist.netlify.app/${address}/behavior`
    )
  })

  return {
    behavior: behavior({ world, app }),
  }
}
