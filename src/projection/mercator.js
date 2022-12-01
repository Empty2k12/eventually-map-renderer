const TILE_SIZE = 256;

const EARTH_RADIUS = 6378137;

const MIN_LATITUDE = -85.05112878;
const MAX_LATITUDE = 85.05112878;

export const project = (latLng) => {
  let siny = Math.sin((latLng.lat * Math.PI) / 180);

  // todo use MIN_LATITUDE and MAX_LATITUDE
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);

  return {
      x: TILE_SIZE * (0.5 + latLng.lon / 360),
      y: TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  };
};

export const unproject = (xy, zoom) => {
    let mapSize = calculateMapSize(zoom, TILE_SIZE);

    var x = (clip(xy.x, 0, mapSize - 1) / mapSize) - 0.5;
    var y = 0.5 - (clip(xy.y, 0, mapSize - 1) / mapSize);

    return {
        x: 360 * x,
        y: 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI
    }
}

export function formatToPoint(latLng, zoom) {
  const worldCoordinate = project(latLng);
  const scale = Math.pow(2, zoom);

  let x = Math.floor(worldCoordinate.x * scale);
  let y = Math.floor(worldCoordinate.y * scale);

  return [-x, y];
}

/**
 * Clips a number to the specified minimum and maximum values.
 * @param n The number to clip.
 * @param minValue Minimum allowable value.
 * @param maxValue Maximum allowable value.
 * @returns The clipped value.
 */
const clip = (n, minValue, maxValue) => Math.min(Math.max(n, minValue), maxValue);

const calculateMapSize = (zoom) => Math.ceil(TILE_SIZE * Math.pow(2, zoom));

export const groundResolution = (latitude, zoom) => {
    latitude = clip(latitude, MIN_LATITUDE, MAX_LATITUDE);
    return Math.cos(latitude * Math.PI / 180) * 2 * Math.PI * EARTH_RADIUS / calculateMapSize(zoom, TILE_SIZE);
}

