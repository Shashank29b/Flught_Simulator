import { describe, expect, it } from 'vitest'
import { hsiBarOffsetPx, hsiInput } from '../../app/components/instruments/hsiMath'
import { RWY09, SEED_STATIONS } from './helpers/fixtures'
import type { IlsOutput, VorOutput } from '../../shared/types'

const ils: IlsOutput = { locValid: true, locDevDeg: 1, locFrac: 0.4, gsValid: true, gsDevDeg: -0.35, gsFrac: -0.5 }
const vor: VorOutput = { valid: true, ident: 'TRN', radialDeg: 270, obsDeg: 90, toFrom: 'TO', cdiDevDeg: 5, cdiFrac: 0.5 }

describe('HSI', () => {
  it('shows the ILS (runway course) when NAV 1 is tuned to a localiser', () => {
    const h = hsiInput(SEED_STATIONS, [RWY09], 110.3, 45, { x: -8, y: 0 }, vor, ils)
    expect(h).toMatchObject({ mode: 'LOC', courseDeg: 90, devFrac: 0.4, navValid: true, gsValid: true, gsFrac: -0.5, ident: 'ITRN' })
  })
  it('shows the VOR with the OBS course otherwise', () => {
    const h = hsiInput(SEED_STATIONS, [RWY09], 113.5, 90, { x: -8, y: 6 }, vor, ils)
    expect(h).toMatchObject({ mode: 'VOR', courseDeg: 90, devFrac: 0.5, toFrom: 'TO', gsValid: false })
  })
  it('flags NAV when the VOR is invalid', () => {
    expect(hsiInput([], [], 113.5, 90, { x: 0, y: 0 }, { ...vor, valid: false }).navValid).toBe(false)
  })
  it('bar offset: full scale is two dots', () => {
    expect(hsiBarOffsetPx(1, 10)).toBe(20)
    expect(hsiBarOffsetPx(-0.5, 10)).toBe(-10)
    expect(hsiBarOffsetPx(3, 10)).toBe(20)
  })
})
