import { describe, it, expect } from "vitest"
import { largestRemainder } from "../largest-remainder"

describe("largestRemainder", () => {
  it("3 Blöcke 40/35/25 → 7/6/5", () => {
    const result = largestRemainder([
      { blockId: "A", weight: 40 },
      { blockId: "B", weight: 35 },
      { blockId: "C", weight: 25 },
    ])
    expect(result.find((r) => r.blockId === "A")?.count).toBe(7)
    expect(result.find((r) => r.blockId === "B")?.count).toBe(6)
    expect(result.find((r) => r.blockId === "C")?.count).toBe(5)
  })

  it("5 Blöcke 50/20/15/10/5 → Summe = 18", () => {
    const result = largestRemainder([
      { blockId: "A", weight: 50 },
      { blockId: "B", weight: 20 },
      { blockId: "C", weight: 15 },
      { blockId: "D", weight: 10 },
      { blockId: "E", weight: 5 },
    ])
    const total = result.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(18)
    result.forEach((r) => expect(r.count).toBeGreaterThanOrEqual(1))
  })

  it("1%-Block bekommt mindestens 1 Frage", () => {
    const result = largestRemainder([
      { blockId: "A", weight: 99 },
      { blockId: "B", weight: 1 },
    ])
    const b = result.find((r) => r.blockId === "B")
    expect(b?.count).toBeGreaterThanOrEqual(1)
    const total = result.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(18)
  })

  it("2 Blöcke 50/50 → jeweils 9", () => {
    const result = largestRemainder([
      { blockId: "A", weight: 50 },
      { blockId: "B", weight: 50 },
    ])
    expect(result.find((r) => r.blockId === "A")?.count).toBe(9)
    expect(result.find((r) => r.blockId === "B")?.count).toBe(9)
  })

  it("Teilklausur: einzelner Block erhält alle berechneten Fragen", () => {
    // Teilklausur-Formel: Math.max(3, Math.min(18, Math.round(weight/100 * 18)))
    const totalQ = Math.max(3, Math.min(18, Math.round(0.25 * 18))) // = 5
    const result = largestRemainder([{ blockId: "A", weight: 25 }], totalQ)
    expect(result[0].count).toBe(totalQ)
  })
})
