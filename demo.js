import REGL from "regl";
import { mat4 } from "gl-matrix";
import Stats from "stats.js";

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

const wayColor = (way) => {
  if(["primary", "primary_link"].includes(way.tags.highway)) {
    return [0.98823529, 0.83921569, 0.64313725];
  }

  if(["residential", "secondary", "tertiary", "living_street", "unclassified", "pedestrian"].includes(way.tags.highway)) {
    return [1, 1, 1];
  }

  if(["footway", "steps", "cycleway"].includes(way.tags.highway)) {
    return [0.95294118, 0.60392157, 0.54117647];
  }

  if(way.tags.highway === "service") {
    return [0.85,0.85,0.85];
  }

  return [0,0,0];
}

const wayWidth = (way) => {
  if(["primary"].includes(way.tags.highway)) {
    return 18;
  }

  if(["residential", "secondary", "tertiary", "living_street", "primary_link"].includes(way.tags.highway)) {
    return 12;
  }

  if(["footway", "steps"].includes(way.tags.highway)) {
    return 2;
  }

  if(["service", "pedestrian"].includes(way.tags.highway)) {
    return 7;
  }

  return 7;
}

const ways = json.elements.filter(el => el.type === "way");
const nodes = json.elements.filter(el => el.type === "node");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const lat = urlParams.get("lat") ?? 50.782366;
const lon = urlParams.get("lon") ?? 6.083527;

const rendered_highways = [
  "secondary",
  "primary",
  "tertiary",
  "residential",
  "pedestrian",
  "primary_link",
  "service",
  "living_street",
  "unclassified",
  "cycleway",
  "tertiary_link",
]

// "footway", "steps", "track",

const wayCoords = ways.filter(way => rendered_highways.includes(way.tags.highway)).map(way => ({
  ...way,
  node_locations: way.nodes.map(node_id => nodes.find(node => node.id === node_id))
}));

export function diagonalDemo(
  generateContext,
  renderFrame
) {
  const { canvas, regl } = initialize();

  var stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const projection = mat4.ortho(
    mat4.create(),
    0,
    canvas.width,
    0,
    canvas.height,
    1,
    -1
  );

  const context = generateContext({
    regl,
    canvas
  });

  const positionsBuffer = regl.buffer([]);
  const colorBuffer = regl.buffer([]);
  const widthsBuffer = regl.buffer([]);

  let zoom = 17;
  let scrollY = 0;

  document.addEventListener("wheel", (e) => {
    scrollY = e.deltaY;
  })

  regl.frame(({time}) => {
    stats.begin();
    zoom += scrollY * -0.001;
    zoom = Math.max(zoom, 16);
    zoom = Math.min(zoom, 20);
    scrollY *= 0.01;
    if(scrollY < 0.1) {
      scrollY = 0;
    }

    // Clear Screen Color
    regl.clear({
      color: [0.94901961, 0.9372549, 0.91372549, 1],
      depth: 1
    })

    // Construct View Matrix at view center, looking at view center
    const [centerX, centerY] = formatToPoint({lat, lon}, zoom);
    const view = mat4.lookAt(mat4.create(), [centerX-canvas.height/2, centerY-canvas.width/2, 1], [centerX-canvas.height/2, centerY-canvas.width/2, 0], [0,1,0]);

    const positions = [];
    const colors = [];
    const widths = [];

    wayCoords.forEach(way => {
      positions.push(...way.node_locations.map(({lat, lon}) => formatToPoint({lat, lon}, zoom)), 0)
      colors.push(...way.node_locations.map(_ => wayColor(way)), 0);
      widths.push(...way.node_locations.map(_ => wayWidth(way)), 0);
    })

    positionsBuffer({
      data: positions
    });
    colorBuffer({
      data: colors
    });
    widthsBuffer({
      data: widths
    })
    renderFrame({
        regl,
        context,
        positionsBuffer,
        colorBuffer,
        widthsBuffer,
        canvas,
        projection,
        view,
        viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        pointData: positions
    });
	  stats.end();
  })
}

export function initialize() {
  document.body.style.margin = "0px";
  document.body.parentElement.style.height = "100%";
  document.body.style.width = document.body.style.height = "100%";
  document.body.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.style.width = canvas.style.height = "100%";
  document.body.appendChild(canvas);

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
  canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);

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