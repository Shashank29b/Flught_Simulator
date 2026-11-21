/** Heading-up projection for the ND: aircraft at (cx, cy), up = current heading. */
export function ndProject(p: { x: number; y: number }, ac: { x: number; y: number }, hdgDeg: number, pxPerNm: number, cx: number, cy: number): [number, number] {
  const h = (hdgDeg * Math.PI) / 180
  const rx = p.x - ac.x
  const ry = p.y - ac.y
  const xr = rx * Math.cos(h) - ry * Math.sin(h)
  const yr = rx * Math.sin(h) + ry * Math.cos(h)
  return [cx + xr * pxPerNm, cy - yr * pxPerNm]
}
