/**
 * Complementary INS/GPS blend. `est` is the current estimate of the INS error. Each GPS fix measures
 * INS − GPS = insErr − gpsErr; the estimate moves a fraction k toward it. Blended position = INS − est.
 * With no fix (outage) the estimate is frozen, so the blended position drifts with the INS again.
 */
export function blendStep(est: [number, number], insErr: [number, number], gpsErr: [number, number] | null, k = 0.3): [number, number] {
  if (!gpsErr) return est
  const mx = insErr[0] - gpsErr[0]
  const my = insErr[1] - gpsErr[1]
  return [est[0] + k * (mx - est[0]), est[1] + k * (my - est[1])]
}
