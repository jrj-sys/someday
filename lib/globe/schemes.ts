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

// "#ffb01f" -> { red: 255, green: 176, blue: 31 }
function hexToRgb(hex: string) {
  return {
    red: parseInt(hex.slice(1, 3), 16),
    green: parseInt(hex.slice(3, 5), 16),
    blue: parseInt(hex.slice(5, 7), 16),
  }
}

// blends two hex colors. amount 0 gives you `from`, 1 gives you `to`, and
// anything between slides along the line connecting them
export function mix(from: string, to: string, amount: number) {
  const start = hexToRgb(from)
  const end = hexToRgb(to)

  function blendChannel(startValue: number, endValue: number) {
    const distance = endValue - startValue
    return Math.round(startValue + distance * amount)
  }

  const red = blendChannel(start.red, end.red)
  const green = blendChannel(start.green, end.green)
  const blue = blendChannel(start.blue, end.blue)

  return `rgb(${red}, ${green}, ${blue})`
}
