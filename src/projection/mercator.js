const TILE_SIZE = 256;

// https://github.com/MicrosoftDocs/azure-docs/blob/main/articles/azure-maps/zoom-levels-and-tile-grid.md

const EARTH_RADIUS = 6378137;

const MIN_LATITUDE = -85.05112878;
const MAX_LATITUDE = 85.05112878;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

export const project = (position, zoom) => {
  var latitude = clip(position.lat, MIN_LATITUDE, MAX_LATITUDE);
  var longitude = clip(position.lon, MIN_LONGITUDE, MAX_LONGITUDE);

  var x = (longitude + 180) / 360;
  var sinLatitude = Math.sin(latitude * Math.PI / 180);
  var y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);

  var mapSize = calculateMapSize(zoom, TILE_SIZE);

  return [
      -clip(x * mapSize + 0.5, 0, mapSize - 1),
      clip(y * mapSize + 0.5, 0, mapSize - 1)
  ];
}

export const unproject = (xy, zoom) => {
    let mapSize = calculateMapSize(zoom, TILE_SIZE);

    var x = (clip(xy.x, 0, mapSize - 1) / mapSize) - 0.5;
    var y = 0.5 - (clip(xy.y, 0, mapSize - 1) / mapSize);

    return {
        x: 360 * x,
        y: 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI
    }
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

