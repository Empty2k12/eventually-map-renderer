import REGL from "regl";
import { mat4 } from "gl-matrix";

import json from "./aachen.json";

const ways = json.elements.filter(el => el.type === "way");
const nodes = json.elements.filter(el => el.type === "node");

const wayCoords = ways.filter(way => ["footway", "service"].includes(way.tags.highway) || ["Wittekindstraße", "Saarstraße", "Ludwigsallee", "Friesenstraße", "Malteserstraße", "Marienbongard", "Veltmanplatz", "Hermannstraße", "Pontstraße", "Kreuzherrenstraße", "Pontdriesch", "Bergdriesch", "Hirschgraben", "Bergstraße", "Achterstraße", "Kupferstraße", "Lousbergstraße", "Weyhestraße"].includes(way.tags.name)).map(way => ({
  ...way,
  node_locations: way.nodes.map(node_id => nodes.find(node => node.id === node_id)).map(node => [node.lon * 200000, node.lat * 200000])
}));

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

  const view = mat4.lookAt(mat4.create(), [1216341-canvas.width/2, 10156231-canvas.height/2, 1], [1216341-canvas.width/2, 10156231-canvas.height/2, 0], [0,1,0]);

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

  // // regl.frame() wraps requestAnimationFrame and also handles viewport changes
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