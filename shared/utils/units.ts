export const NM_TO_FT = 6076.12
export const NM_TO_M = 1852
export const KT_TO_MPS = 0.514444
export const KT_TO_FPM = 101.2687
export const G = 9.80665
/** VOBL Kempegowda International field elevation (OurAirports). Terrain is flat at this height. */
export const AIRPORT_ELEV_FT = 3000

export const deg2rad = (d: number): number => (d * Math.PI) / 180
export const rad2deg = (r: number): number => (r * 180) / Math.PI
export const wrap360 = (a: number): number => ((a % 360) + 360) % 360
export const wrap180 = (a: number): number => wrap360(a + 180) - 180
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
