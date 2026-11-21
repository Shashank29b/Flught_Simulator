import { gaussian } from '../../shared/utils/random'

/** One GPS fix: the measurement error (metres) relative to the true position, or null during an outage. */
export function gpsFix(rng: () => number, opts: { sigmaM?: number; outage: boolean }): [number, number] | null {
  if (opts.outage) return null
  const s = opts.sigmaM ?? 5
  return [s * gaussian(rng), s * gaussian(rng)]
}
