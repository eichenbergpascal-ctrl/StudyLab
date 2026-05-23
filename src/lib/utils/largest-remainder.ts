export interface BlockWeight {
  blockId: string
  weight: number
}

export interface BlockCount {
  blockId: string
  count: number
}

/**
 * Distributes totalQuestions across blocks using the Largest-Remainder method.
 * Every block with weight > 0 gets at least 1 question.
 */
export function largestRemainder(
  blocks: BlockWeight[],
  totalQuestions = 18,
): BlockCount[] {
  const eligible = blocks.filter((b) => b.weight > 0)
  if (eligible.length === 0) return []

  const totalWeight = eligible.reduce((sum, b) => sum + b.weight, 0)

  const computed = eligible.map((b) => {
    const exact = (b.weight / totalWeight) * totalQuestions
    const naturalFloor = Math.floor(exact)
    return { blockId: b.blockId, exact, naturalFloor, remainder: exact - naturalFloor }
  })

  // Apply minimum 1 for each eligible block
  const counts = computed.map((c) => Math.max(1, c.naturalFloor))
  let totalAllocated = counts.reduce((sum, c) => sum + c, 0)
  let remaining = totalQuestions - totalAllocated

  if (remaining > 0) {
    // Give extra slots to blocks with the largest fractional remainders
    const order = computed
      .map((c, i) => ({ i, rem: c.remainder }))
      .sort((a, b) => b.rem - a.rem)
    for (let j = 0; j < remaining && j < order.length; j++) {
      counts[order[j].i] += 1
    }
  } else if (remaining < 0) {
    // Over-allocated due to minimums — remove from blocks with smallest remainders
    // (cannot reduce below 1)
    const order = computed
      .map((c, i) => ({ i, rem: c.remainder }))
      .sort((a, b) => a.rem - b.rem)
    let j = 0
    while (remaining < 0 && j < order.length * eligible.length) {
      const idx = order[j % order.length].i
      if (counts[idx] > 1) {
        counts[idx] -= 1
        remaining++
      }
      j++
    }
  }

  return eligible.map((b, i) => ({ blockId: b.blockId, count: counts[i] }))
}
