/**
 * International Standard Atmosphere (ICAO Doc 7488), troposphere + lower stratosphere (< 20 km).
 * Altitudes in feet, temperatures in K or °C as named, pressures in Pa (hPa where named).
 */
export const ISA_T0 = 288.15 // K
export const ISA_P0 = 101325 // Pa
export const ISA_RHO0 = 1.225 // kg/m³
export const ISA_LAPSE = 0.0065 // K/m
export const R_AIR = 287.05287 // J/(kg·K)
export const GAMMA = 1.4
export const G0 = 9.80665
const FT = 0.3048
const KT = 0.514444
const EXP = G0 / (R_AIR * ISA_LAPSE) // 5.25588
const TROPOPAUSE_M = 11000
const T11 = 216.65
const P11 = ISA_P0 * (T11 / ISA_T0) ** EXP
export const A0_KT = Math.sqrt(GAMMA * R_AIR * ISA_T0) / KT // 661.48 kt

export interface Atmosphere { qnhHpa: number; isaDevC: number }
export const STANDARD_ATMOSPHERE: Atmosphere = { qnhHpa: 1013.25, isaDevC: 0 }

export interface AtmoPoint { tempK: number; oatC: number; pressurePa: number; density: number; sigma: number; speedOfSoundKt: number }

/** ISA pressure (Pa) at a pressure altitude (ft). */
export function isaPressure(pressureAltFt: number): number {
  const h = pressureAltFt * FT
  if (h <= TROPOPAUSE_M) return ISA_P0 * (1 - (ISA_LAPSE * h) / ISA_T0) ** EXP
  return P11 * Math.exp((-G0 / (R_AIR * T11)) * (h - TROPOPAUSE_M))
}

/** Pressure altitude (ft) for a static pressure (Pa). */
export function pressureAltitudeFt(pressurePa: number): number {
  if (pressurePa >= P11) return ((ISA_T0 / ISA_LAPSE) * (1 - (pressurePa / ISA_P0) ** (1 / EXP))) / FT
  return (TROPOPAUSE_M - (Math.log(pressurePa / P11) * R_AIR * T11) / G0) / FT
}

/** ISA temperature (K) at a pressure altitude (ft). */
export function isaTempK(pressureAltFt: number): number {
  const h = pressureAltFt * FT
  return h <= TROPOPAUSE_M ? ISA_T0 - ISA_LAPSE * h : T11
}

/** Static pressure at a true (MSL) altitude when the sea-level pressure is QNH. */
export function staticPressurePa(altFt: number, atmo: Atmosphere = STANDARD_ATMOSPHERE): number {
  return isaPressure(altFt) * (atmo.qnhHpa / 1013.25)
}

/** Full atmosphere state at a true altitude. */
export function atmosphereAt(altFt: number, atmo: Atmosphere = STANDARD_ATMOSPHERE): AtmoPoint {
  const pressurePa = staticPressurePa(altFt, atmo)
  const tempK = isaTempK(pressureAltitudeFt(pressurePa)) + atmo.isaDevC
  const density = pressurePa / (R_AIR * tempK)
  return {
    tempK, oatC: tempK - 273.15, pressurePa, density, sigma: density / ISA_RHO0,
    speedOfSoundKt: Math.sqrt(GAMMA * R_AIR * tempK) / KT,
  }
}

/** Calibrated (≈ indicated) airspeed → true airspeed and Mach, compressible flow. */
export function casToTas(casKt: number, altFt: number, atmo: Atmosphere = STANDARD_ATMOSPHERE): { tasKt: number; mach: number } {
  if (casKt <= 0) return { tasKt: 0, mach: 0 }
  const a = atmosphereAt(altFt, atmo)
  const qc = ISA_P0 * ((1 + 0.2 * (casKt / A0_KT) ** 2) ** 3.5 - 1)
  const mach = Math.sqrt(5 * ((qc / a.pressurePa + 1) ** (2 / 7) - 1))
  return { tasKt: mach * a.speedOfSoundKt, mach }
}

/** True airspeed → calibrated airspeed (inverse of casToTas). */
export function tasToCas(tasKt: number, altFt: number, atmo: Atmosphere = STANDARD_ATMOSPHERE): number {
  if (tasKt <= 0) return 0
  const a = atmosphereAt(altFt, atmo)
  const mach = tasKt / a.speedOfSoundKt
  const qc = a.pressurePa * ((1 + 0.2 * mach * mach) ** 3.5 - 1)
  return A0_KT * Math.sqrt(5 * ((qc / ISA_P0 + 1) ** (2 / 7) - 1))
}

/** Altimeter reading for a true altitude with the Kollsman window set to baroHpa (temperature error ignored). */
export function indicatedAltitudeFt(altFt: number, baroHpa: number, atmo: Atmosphere = STANDARD_ATMOSPHERE): number {
  const p = staticPressurePa(altFt, atmo)
  return pressureAltitudeFt(p * (1013.25 / baroHpa))
}

/** Density altitude (ft): the ISA altitude with the same density. */
export function densityAltitudeFt(altFt: number, atmo: Atmosphere = STANDARD_ATMOSPHERE): number {
  const sigma = atmosphereAt(altFt, atmo).sigma
  return ((ISA_T0 / ISA_LAPSE) * (1 - sigma ** (1 / (EXP - 1)))) / FT
}
