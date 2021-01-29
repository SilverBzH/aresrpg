import run, { SUCCESS } from '../behavior.js'

async function run_child(child, { result, index }, context) {
  const { status, state, time } = result

  if (status === SUCCESS) {
    const child_result = await run(child, { state, time }, context)

    return { result: child_result, index }
  } else return { result, index }
}

function child_reducer(context) {
  return async (intermediate, child, index) =>
    await run_child(child, await intermediate, {
      ...context,
      path: `${context.path}.${index}`,
    })
}

export function sequence(node, { state, time }, context) {
  const last = state[context.path] ?? 0

  const { index, result } = node.childNodes
    .slice(last)
    .reduce(child_reducer(context), {
      result: {
        status: SUCCESS,
        state,
        time,
      },
    })

  return {
    ...result,
    state: {
      ...result.state,
      [context.path]: index,
    },
  }
}

export function reactive_sequence(node, { state, time }, context) {
  const { result } = node.childNodes.reduce(child_reducer(context), {
    result: {
      status: SUCCESS,
      state,
      time,
    },
  })

  return result
}
