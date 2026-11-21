interface SampleLike { x: number; nav: unknown }

/** Mean |locFrac| over samples within 4 NM before the threshold (−4 ≤ x ≤ 0). */
export function meanAbsLocFrac(samples: SampleLike[]): number {
  const vals: number[] = []
  for (const s of samples) {
    if (s.x < -4 || s.x > 0) continue
    const v = (s.nav as { locFrac?: unknown } | null)?.locFrac
    if (typeof v === 'number' && Number.isFinite(v)) vals.push(Math.abs(v))
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}
