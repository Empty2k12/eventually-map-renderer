import REGL from "regl";
import { mat4 } from "gl-matrix";

import json from "./aachen.json";

const project = (latLng) => {
  const TILE_SIZE = 256;
  let siny = Math.sin((latLng.lat * Math.PI) / 180);

  siny = Math.min(Math.max(siny, -0.9999), 0.9999);

  return {
      x: TILE_SIZE * (0.5 + latLng.lon / 360),
      y: TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  };
};

function formatToPoint(latLng, zoom) {
  const worldCoordinate = project(latLng);
  const scale = Math.pow(2, zoom);

  let x = Math.floor(worldCoordinate.x * scale);
  let y = Math.floor(worldCoordinate.y * scale);

  return [y, x];
}

const ways = json.elements.filter(el => el.type === "way");
const nodes = json.elements.filter(el => el.type === "node");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const zoom = urlParams.get("zoom") ?? 16;
const lat = urlParams.get("lat") ?? 50.7810827;
const lon = urlParams.get("lon") ?? 6.0824173;

const wayCoords = ways.filter(way => ["footway", "service", "steps"].includes(way.tags.highway) || ["Wittekindstraße", "Saarstraße", "Ludwigsallee", "Friesenstraße", "Malteserstraße", "Marienbongard", "Veltmanplatz", "Hermannstraße", "Pontstraße", "Kreuzherrenstraße", "Pontdriesch", "Bergdriesch", "Hirschgraben", "Bergstraße", "Achterstraße", "Kupferstraße", "Lousbergstraße", "Weyhestraße"].includes(way.tags.name)).map(way => ({
  ...way,
  node_locations: way.nodes.map(node_id => nodes.find(node => node.id === node_id)).map(({lat, lon}) => formatToPoint({lat, lon}, zoom))
}));

const [centerX, centerY] = formatToPoint({lat, lon}, zoom);

export function diagonalDemo(
  generateContext,
  renderFrame
) {
  const { canvas, regl } = initialize();

  const projection = mat4.ortho(
    mat4.create(),
    0,
    canvas.width,
    0,
    canvas.height,
    1,
    -1
  );

  const view = mat4.lookAt(mat4.create(), [centerX-canvas.height/2, centerY-canvas.width/2, 1], [centerX-canvas.height/2, centerY-canvas.width/2, 0], [0,1,0]);

  const context = generateContext({
    regl,
    canvas
  });

  // clear contents of the drawing buffer
  regl.clear({
    color: [0, 0, 0, 0],
    depth: 1
  })

  wayCoords.forEach(way => {
      console.log(way.node_locations);
      const buffer = regl.buffer(way.node_locations);
      buffer({
          data: way.node_locations
        });
      renderFrame({
          regl,
          context,
          buffer,
          canvas,
          projection,
          view,
          viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
          pointData: way.node_locations,
          way
      });
  })

  // regl.frame(({time}) => {
    
  // })
}

export function initialize() {
  document.body.style.margin = "0px";
  document.body.parentElement.style.height = "100%";
  document.body.style.width = document.body.style.height = "100%";
  document.body.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.style.width = canvas.style.height = "100%";
  document.body.appendChild(canvas);

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const regl = REGL({
    canvas,
    attributes: {
      antialias: true
    },
    extensions: ["ANGLE_instanced_arrays"]
  });

  return {
    canvas,
    regl
  };
}