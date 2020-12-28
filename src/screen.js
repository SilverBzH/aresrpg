import mapcolors from '@aresrpg/aresrpg-map-colors'
import canvas from 'canvas'
import minecraftData from 'minecraft-data'
import UUID from 'uuid-1345'
import Vec3 from 'vec3'

import { floor_pos, intersect_ray_plane, to_direction } from './math.js'
import { version } from './settings.js'

const mcData = minecraftData(version)

const { nearestMatch } = mapcolors
const { createCanvas } = canvas

export function register_screen({ id, size: { width, height } }) {
  return (world) => ({
    ...world,
    screens: {
      ...world.screens,
      [id]: {
        size: { width, height },
        start_id: world.next_entity_id,
      },
    },
    next_entity_id: world.next_entity_id + width * height,
  })
}

export function spawn_item_frame(
  client,
  { entityId, position: { x, y, z, yaw, pitch } }
) {
  client.write('spawn_entity', {
    entityId,
    objectUUID: UUID.v4(),
    type: mcData.entitiesByName.item_frame.id,
    x,
    y,
    z,
    yaw,
    pitch,
    headPitch: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    objectData: 3,
  })

  client.write('entity_metadata', {
    entityId,
    metadata: [
      {
        key: 7,
        value: {
          present: true,
          itemId: mcData.itemsByName.filled_map.id,
          itemCount: 1,
          nbtData: {
            type: 'compound',
            name: 'tag',
            value: {
              map: {
                type: 'int',
                value: entityId,
              },
            },
          },
        },
        type: 6,
      },
    ],
  })
}

export function spawn_screen(
  { client, world },
  { screen_id, position, direction }
) {
  const up = Vec3(0, 1, 0)
  const right = Vec3(1, 0, 0)
  const dir = Vec3(direction).normalize()
  const forward = dir.cross(up)

  const pitch = Math.acos(forward.dot(up)) * (128 / Math.PI) - 128 + 64
  const yaw = Math.acos(forward.dot(right)) * (128 / Math.PI) - 128 + 64

  const screen = get_screen(world, screen_id)

  screen.position = floor_pos(position)
  screen.direction = direction

  const { size, start_id } = screen

  for (let frame_y = 0; frame_y < size.height; frame_y++) {
    for (let frame_x = 0; frame_x < size.width; frame_x++) {
      const index = frame_x + frame_y * size.width

      const frame_pos = dir
        .scaled(frame_x)
        .add(screen.position)
        .offset(0, -frame_y, 0)
      frame_pos.pitch = pitch
      frame_pos.yaw = yaw

      spawn_item_frame(client, {
        entityId: index + start_id,
        position: frame_pos,
      })
    }
  }
}

export function update_screen(
  { client, world },
  { screen_id, newCanvas, oldCanvas }
) {
  const { size, start_id } = get_screen(world, screen_id)

  for (let frame = 0; frame < size.width * size.height; frame++) {
    let different = true
    const new_image_data = newCanvas
      .getContext('2d')
      .getImageData(
        128 * (frame % size.width),
        128 * Math.floor(frame / size.width),
        128,
        128
      )
    if (oldCanvas) {
      different = false
      const old_image_data = oldCanvas
        .getContext('2d')
        .getImageData(
          128 * (frame % size.width),
          128 * Math.floor(frame / size.width),
          128,
          128
        )
      for (let i = 0; i < new_image_data.data.length; i++) {
        if (new_image_data.data[i] !== old_image_data.data[i]) different = true
      }
    }

    if (different) {
      const buff = Buffer.alloc(128 * 128, 4)
      for (let i = 0; i < new_image_data.data.length; i += 4) {
        const r = new_image_data.data[i]
        const g = new_image_data.data[i + 1]
        const b = new_image_data.data[i + 2]
        buff[i / 4] = nearestMatch(r, g, b)
      }
      client.write('map', {
        itemDamage: start_id + frame,
        scale: 1,
        trackingPosition: false,
        locked: false,
        icons: [],
        columns: -128,
        rows: -128,
        x: 0,
        y: 0,
        data: buff,
      })
    }
  }
  return { newCanvas }
}

export function destroy_screen({ client, world }, { screen_id }) {
  const { size, start_id } = get_screen(world, screen_id)

  client.write('entity_destroy', {
    entityIds: Array.from({
      length: size.width * size.height,
    }).map((v, index) => start_id + index),
  })
}

export function get_screen(world, screen_id) {
  return world.screens[screen_id]
}

export function copy_canvas(old_canvas) {
  const new_canvas = createCanvas(old_canvas.width, old_canvas.height)
  const imageData = old_canvas
    .getContext('2d')
    .getImageData(0, 0, old_canvas.width, old_canvas.height)
  new_canvas.getContext('2d').putImageData(imageData, 0, 0)
  return new_canvas
}

export function interract_screen({ client, world, events }) {
  client.on('arm_animation', ({ hand }) => {
    events.once('state', (state) => {
      const { position } = state
      for (const [screen_id, screen] of Object.entries(world.screens)) {
        const { direction, position: screen_pos, size } = screen
        const dir = Vec3(direction).normalize()
        const normal = dir.cross(Vec3(0, 1, 0))
        const player_forward = to_direction(position.yaw, position.pitch)
        const dot = normal.dot(player_forward)
        if (dot <= 0) {
          const hit = intersect_ray_plane(
            Vec3(position).offset(0, 0.62, 0),
            player_forward,
            normal,
            -normal.dot(screen_pos) - 0.0625 - 0.0078125
          )

          if (hit) {
            const x = dir.dot(hit.minus(screen_pos))
            const y = screen_pos.y - hit.y
            if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
              events.emit('screen_interract', {
                x: Math.floor(x * 128),
                y: Math.floor(y * 128),
                screen_id,
                hand,
              })
            }
          }
        }
      }
    })
  })
}