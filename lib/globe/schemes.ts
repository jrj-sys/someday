// a country can be saying three things at once, so the palette has to keep
// them apart: somewhere you've been, somewhere you should go, and whichever
// one you just clicked.
//
// this lives away from GlobeView on purpose. importing it from there would
// pull react-globe.gl into the server bundle and blow up ssr with
// "window is not defined"
export const GLOBE_COLORS = {
  ocean: '#2e86c1',
  base: '#fdeecd', // never been, no opinion
  visited: '#14384f', // darker than ocean-deep so it separates from the sea
  hover: '#ffd166',
  recLow: '#ffe4a3', // weak recommendation
  recHigh: '#ffb01f', // strong one, glows bright
  selectedStroke: '#ffffff',
  stroke: '#2e86c1',
  landEdge: 'rgba(27, 73, 101, 0.4)',
}

// blends two hex colors
export function mix(from: string, to: string, amount: number) {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [r1, g1, b1] = parse(from)
  const [r2, g2, b2] = parse(to)
  const channel = (a: number, b: number) => Math.round(a + (b - a) * amount)
  return `rgb(${channel(r1, r2)}, ${channel(g1, g2)}, ${channel(b1, b2)})`
}
