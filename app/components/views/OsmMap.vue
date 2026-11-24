<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import type * as Leaflet from 'leaflet'
import { toLatLon } from '#shared/utils/geo'
import { NM_TO_M, deg2rad } from '#shared/utils/units'
import type { AirportRow, RunwayRow, StationRow } from '../../composables/useNavData'
import { navPositions, type World } from '../../sim/engine'

const props = defineProps<{ world: World; trail: { x: number; y: number }[] }>()
const el = ref<HTMLDivElement | null>(null)
const follow = ref(true)
let L: typeof Leaflet | null = null
const map = shallowRef<Leaflet.Map | null>(null)
let aircraft: Leaflet.Marker | null = null
let trailLine: Leaflet.Polyline | null = null
let insMarker: Leaflet.CircleMarker | null = null
let blendMarker: Leaflet.CircleMarker | null = null
type LayerKey = 'airports' | 'runways' | 'ils' | 'vor' | 'ndb' | 'markers' | 'trail' | 'insgps'
const LAYER_KEYS: LayerKey[] = ['airports', 'runways', 'ils', 'vor', 'ndb', 'markers', 'trail', 'insgps']
const groups: Partial<Record<LayerKey, Leaflet.LayerGroup>> = {}
const visible = ref<Record<LayerKey, boolean>>(loadVisibility())

function loadVisibility(): Record<LayerKey, boolean> {
  const all = Object.fromEntries(LAYER_KEYS.map(k => [k, true])) as Record<LayerKey, boolean>
  try {
    const saved = JSON.parse(localStorage.getItem('skynav.mapLayers') ?? 'null') as Partial<Record<LayerKey, boolean>> | null
    return { ...all, ...(saved ?? {}) }
  }
  catch {
    return all
  }
}

function applyVisibility(): void {
  if (!map.value) return
  for (const k of LAYER_KEYS) {
    const g = groups[k]
    if (!g) continue
    if (visible.value[k] && !map.value.hasLayer(g)) g.addTo(map.value)
    if (!visible.value[k] && map.value.hasLayer(g)) g.remove()
  }
  try { localStorage.setItem('skynav.mapLayers', JSON.stringify(visible.value)) }
  catch { /* storage unavailable */ }
}

function setAll(on: boolean): void {
  visible.value = Object.fromEntries(LAYER_KEYS.map(k => [k, on])) as Record<LayerKey, boolean>
}
let lastUpdate = 0

const COLORS: Record<string, string> = { VOR: '#0284c7', DVOR: '#0284c7', NDB: '#9333ea', ILS_LOC: '#16a34a', ILS_GS: '#16a34a', MARKER_OM: '#2563eb', MARKER_MM: '#d97706', MARKER_IM: '#64748b' }
const ll = (x: number, y: number): [number, number] => { const p = toLatLon({ x, y }, props.world.ref); return [p.lat, p.lon] }

function planeIcon(hdg: number): Leaflet.DivIcon {
  return L!.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<svg width="30" height="30" viewBox="-15 -15 30 30" style="transform:rotate(${hdg}deg);filter:drop-shadow(0 0 2px #000)"><path d="M0,-13 L2,-4 L12,2 L12,4 L2,1 L1,9 L4,12 L4,13 L0,12 L-4,13 L-4,12 L-1,9 L-2,1 L-12,4 L-12,2 L-2,-4 Z" fill="#facc15" stroke="#000" stroke-width="0.8"/></svg>`,
  })
}

const AIRPORT_STYLE: Record<string, { r: number; color: string }> = {
  large_airport: { r: 7, color: '#dc2626' }, medium_airport: { r: 5, color: '#ea580c' }, small_airport: { r: 3.5, color: '#64748b' },
}
const viewInfo = ref('')
/** Default: India only. The toggle loads the whole world. */
const worldData = ref(loadFlag('skynav.worldData'))
function loadFlag(key: string): boolean {
  try { return localStorage.getItem(key) === '1' }
  catch { return false }
}
watch(worldData, (v) => {
  try { localStorage.setItem('skynav.worldData', v ? '1' : '0') }
  catch { /* storage unavailable */ }
  loaded = null
  void loadViewport()
})
let viewSeq = 0
let viewTimer: ReturnType<typeof setTimeout> | null = null
let loaded: { bounds: Leaflet.LatLngBounds; zoom: number } | null = null

/** Loads airports and nav aids for the visible map area (worldwide), detail by zoom level. */
async function loadViewport(): Promise<void> {
  if (!map.value) return
  const seq = ++viewSeq
  const z = map.value.getZoom()
  const b = map.value.getBounds().pad(0.5)
  loaded = { bounds: b, zoom: z }
  const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map(v => v.toFixed(4)).join(',')
  const types = z < 5 ? 'large_airport' : z < 7 ? 'large_airport,medium_airport' : 'large_airport,medium_airport,small_airport'
  const limit = z >= 9 ? 600 : 3000
  try {
    const [airports, stations] = await Promise.all([
      $fetch<AirportRow[]>('/api/airports', { query: { bbox, types, limit, ...(worldData.value ? {} : { country: 'IN' }) } }),
      z >= 6 ? $fetch<StationRow[]>('/api/stations', { query: { bbox, ...(worldData.value ? {} : { country: 'IN' }) } }) : Promise.resolve([] as StationRow[]),
    ])
    if (seq !== viewSeq) return
    drawNav(stations, airports)
    viewInfo.value = `${worldData.value ? 'World' : 'India'} · in this view: ${airports.length} airports${z >= 6 ? `, ${stations.length} nav aids` : ' (zoom in for nav aids)'}${z < 7 ? ' · large/medium only, zoom in for small' : ' · zoom out to see more'}`
  }
  catch {
    viewInfo.value = 'Could not load map data'
  }
}

/** Refetch only when the view leaves the padded area already loaded, or the zoom changes. */
function scheduleViewport(): void {
  if (!map.value) return
  if (loaded && loaded.zoom === map.value.getZoom() && loaded.bounds.contains(map.value.getBounds())) return
  if (viewTimer) clearTimeout(viewTimer)
  viewTimer = setTimeout(() => void loadViewport(), 250)
}

function drawNav(stations: StationRow[], airports: AirportRow[]): void {
  if (!L || !map.value) return
  for (const k of ['airports', 'runways', 'ils', 'vor', 'ndb', 'markers'] as const) {
    groups[k]?.remove()
    groups[k] = L.layerGroup()
  }
  const runwayById = new Map<number, RunwayRow>()
  for (const a of airports) {
    const st = AIRPORT_STYLE[a.type] ?? AIRPORT_STYLE.small_airport!
    L.circleMarker([a.lat, a.lon], { radius: st.r, color: st.color, weight: 2, fillColor: '#fff', fillOpacity: 0.9 })
      .bindTooltip(`${a.ident}${a.iata ? ` / ${a.iata}` : ''} · ${a.name}${a.municipality ? `, ${a.municipality}` : ''}${a.country ? ` (${a.country})` : ''} · elev ${a.elevationFt} ft`, { direction: 'top' })
      .addTo(groups.airports!)
    const z = map.value.getZoom()
    if ((a.type === 'large_airport' && z >= 5) || (a.type === 'medium_airport' && z >= 8)) {
      L.marker([a.lat, a.lon], { icon: L.divIcon({ className: '', html: `<span style="font:600 10px ui-sans-serif;color:${st.color};text-shadow:0 0 3px #fff,0 0 3px #fff;white-space:nowrap">${a.ident}</span>`, iconAnchor: [-8, 6] }), interactive: false }).addTo(groups.airports!)
    }
    for (const r of a.runways ?? []) {
      runwayById.set(r.id, r)
      const h = deg2rad(r.headingDeg)
      const len = r.lengthM / NM_TO_M
      const thr = { lat: r.thresholdLat, lon: r.thresholdLon }
      const end = toLatLon({ x: len * Math.sin(h), y: len * Math.cos(h) }, thr)
      L.polyline([[thr.lat, thr.lon], [end.lat, end.lon]], { color: '#111827', weight: 6, opacity: 0.8 })
        .bindTooltip(`${a.ident} RWY ${r.ident} · ${r.headingDeg.toFixed(0)}°T · ${r.lengthM} m`).addTo(groups.runways!)
    }
  }
  for (const s of stations) {
    if (s.type === 'DME' || s.type === 'ILS_GS') continue
    const isMarker = s.type.startsWith('MARKER')
    const freq = s.type === 'NDB' ? `${s.frequency.toFixed(0)} kHz` : `${s.frequency.toFixed(2)} MHz`
    const group = isMarker ? groups.markers! : s.type === 'NDB' ? groups.ndb! : s.type === 'ILS_LOC' ? groups.ils! : groups.vor!
    L.circleMarker([s.lat, s.lon], { radius: isMarker ? 4 : 7, color: COLORS[s.type] ?? '#000', weight: 2, fillOpacity: 0.25 })
      .bindTooltip(`${s.ident} · ${s.name}${isMarker ? '' : ` · ${freq}`}`, { direction: 'top' })
      .addTo(group)
    const rw = s.type === 'ILS_LOC' && s.runwayId !== null ? runwayById.get(s.runwayId) : undefined
    if (rw) {
      const h = deg2rad(rw.headingDeg)
      const thr = { lat: rw.thresholdLat, lon: rw.thresholdLon }
      const far = toLatLon({ x: -15 * Math.sin(h), y: -15 * Math.cos(h) }, thr)
      L.polyline([[thr.lat, thr.lon], [far.lat, far.lon]], { color: '#16a34a', weight: 1.5, dashArray: '6 6' }).addTo(groups.ils!)
    }
  }
  applyVisibility()
}

function update(force = false): void {
  if (!L || !map.value || !aircraft) return
  const now = performance.now()
  if (!force && now - lastUpdate < 100) return
  lastUpdate = now
  const ac = props.world.ac
  const pos = ll(ac.x, ac.y)
  aircraft.setLatLng(pos)
  aircraft.setIcon(planeIcon(ac.hdgDeg))
  const np = navPositions(props.world)
  insMarker?.setLatLng(ll(np.ins.x, np.ins.y))
  blendMarker?.setLatLng(ll(np.blend.x, np.blend.y))
  trailLine?.setLatLngs([...props.trail.map(p => ll(p.x, p.y)), pos])
  if (follow.value) map.value.panTo(pos, { animate: false })
}

onMounted(async () => {
  L = (await import('leaflet')).default
  if (!el.value) return
  const ac = props.world.ac
  map.value = L.map(el.value, { zoomControl: true, attributionControl: true }).setView(ll(ac.x, ac.y), 11)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Nav data: <a href="https://ourairports.com/data/">OurAirports</a>',
  }).addTo(map.value)
  groups.insgps = L.layerGroup()
  insMarker = L.circleMarker(ll(ac.x, ac.y), { radius: 6, color: '#f97316', weight: 3, fill: false }).bindTooltip('INS position (drifting)').addTo(groups.insgps)
  blendMarker = L.circleMarker(ll(ac.x, ac.y), { radius: 4, color: '#16a34a', weight: 3, fill: false }).bindTooltip('INS + GPS blended position').addTo(groups.insgps)
  groups.trail = L.layerGroup()
  trailLine = L.polyline([], { color: '#65a30d', weight: 2 }).addTo(groups.trail)
  aircraft = L.marker(ll(ac.x, ac.y), { icon: planeIcon(ac.hdgDeg), zIndexOffset: 1000 }).addTo(map.value)
  map.value.on('dragstart', () => { follow.value = false })
  map.value.on('moveend', scheduleViewport)
  void loadViewport()
  update(true)
})
onUnmounted(() => {
  if (viewTimer) clearTimeout(viewTimer)
  map.value?.remove()
})

watch(visible, applyVisibility, { deep: true })
const legendOpen = ref(false)
const LEGEND: { key: LayerKey | null; sym: string; color: string; label: string }[] = [
  { key: 'airports', sym: 'apt', color: '#dc2626', label: 'Airport: large / medium / small' },
  { key: 'runways', sym: 'bar', color: '#111827', label: 'Runway' },
  { key: 'vor', sym: 'circle', color: COLORS.VOR!, label: 'VOR / VOR-DME (NAV 1, MHz)' },
  { key: 'ndb', sym: 'circle', color: COLORS.NDB!, label: 'NDB (ADF, kHz)' },
  { key: 'ils', sym: 'dash', color: '#16a34a', label: 'ILS localiser + approach course' },
  { key: 'markers', sym: 'dot', color: COLORS.MARKER_MM!, label: 'Marker beacons (OM blue, MM amber, IM grey)' },
  { key: 'trail', sym: 'line', color: '#65a30d', label: 'Your flight path' },
  { key: 'insgps', sym: 'ring', color: '#f97316', label: 'INS position (orange) · INS+GPS (green)' },
  { key: null, sym: 'plane', color: '#facc15', label: 'Your aircraft' },
]
watch(() => props.world, () => update())
watch(follow, f => f && update(true))
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="el" class="h-full w-full" />
    <div class="absolute bottom-6 left-2 z-[1000] rounded bg-white/90 p-2 text-[11px] text-slate-800 shadow">
      <div class="flex items-center gap-2">
        <button class="font-semibold" @click="legendOpen = !legendOpen">Legend {{ legendOpen ? '▾' : '▸' }}</button>
        <template v-if="legendOpen">
          <button class="ml-auto rounded bg-slate-200 px-1.5 hover:bg-slate-300" @click="setAll(true)">Show all</button>
          <button class="rounded bg-slate-200 px-1.5 hover:bg-slate-300" @click="setAll(false)">Hide all</button>
        </template>
      </div>
      <ul v-if="legendOpen" class="mt-1 space-y-0.5">
        <li v-for="l in LEGEND" :key="l.label" class="flex items-center gap-2">
          <input v-if="l.key" v-model="visible[l.key]" type="checkbox" class="accent-sky-600" :aria-label="`Show ${l.label}`">
          <span v-else class="inline-block w-[13px]" />
          <svg width="18" height="12" viewBox="0 0 18 12">
            <g v-if="l.sym === 'apt'"><circle cx="4" cy="6" r="3.5" stroke="#dc2626" stroke-width="1.5" fill="#fff" /><circle cx="10" cy="6" r="2.5" stroke="#ea580c" stroke-width="1.5" fill="#fff" /><circle cx="15" cy="6" r="1.8" stroke="#64748b" stroke-width="1.5" fill="#fff" /></g>
            <circle v-else-if="l.sym === 'circle'" cx="9" cy="6" r="5" :stroke="l.color" stroke-width="2" :fill="l.color" fill-opacity="0.25" />
            <circle v-else-if="l.sym === 'dot'" cx="9" cy="6" r="3" :stroke="l.color" stroke-width="2" :fill="l.color" fill-opacity="0.25" />
            <line v-else-if="l.sym === 'dash'" x1="1" y1="6" x2="17" y2="6" :stroke="l.color" stroke-width="2" stroke-dasharray="4 3" />
            <line v-else-if="l.sym === 'bar'" x1="1" y1="6" x2="17" y2="6" :stroke="l.color" stroke-width="5" />
            <g v-else-if="l.sym === 'ring'"><circle cx="5" cy="6" r="4" stroke="#f97316" stroke-width="2" fill="none" /><circle cx="13" cy="6" r="3" stroke="#16a34a" stroke-width="2" fill="none" /></g>
            <line v-else-if="l.sym === 'line'" x1="1" y1="6" x2="17" y2="6" :stroke="l.color" stroke-width="2" />
            <path v-else d="M9,0 L10.4,4 L17,7 L17,8.5 L10.4,7 L10,10 L12,12 L6,12 L8,10 L7.6,7 L1,8.5 L1,7 L7.6,4 Z" :fill="l.color" stroke="#000" stroke-width="0.5" />
          </svg>
          <span>{{ l.label }}</span>
        </li>
      </ul>
    </div>
    <div class="absolute right-2 top-2 z-[1000] flex items-center gap-2 rounded bg-white/90 px-2 py-0.5 text-[11px] text-slate-700 shadow">
      <label class="flex cursor-pointer items-center gap-1 font-semibold"><input v-model="worldData" type="checkbox" class="accent-sky-600"> Whole world</label>
      <span v-if="viewInfo">{{ viewInfo }}</span>
    </div>
    <button class="absolute bottom-6 right-2 z-[1000] rounded px-2 py-1 text-xs font-semibold shadow" :class="follow ? 'bg-sky-600 text-white' : 'bg-white text-slate-800'" @click="follow = !follow">
      {{ follow ? 'Following aircraft' : 'Follow aircraft' }}
    </button>
  </div>
</template>
