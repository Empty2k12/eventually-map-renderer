import REGL from "regl";
import { mat4 } from "gl-matrix";
import Stats from "stats.js";
import earcut from "earcut";

import json from "./aachen2.json";
import { groundResolution, project } from "./src/projection/mercator";
import { areaColor, wayColor, wayWidth } from "./src/style/mapStyle";
import { shouldRenderFeature } from "./src/style/featureSelector";
import { WayRenderer } from "./src/renderer/WayRenderer";
import { PolygonRenderer } from "./src/renderer/PolygonRenderer";
import Pbf from "pbf";
import { Tile } from "./src/proto/vector_tile_proto";

const updateLatLonDisplay = () => document.getElementById("coords").innerHTML = `Center ${lat.toFixed(6)}/${lon.toFixed(6)}`;
const updateZoomDisplay = () => document.getElementById("zoom").innerHTML = `Zoom ${zoom.toFixed(4)}`;

const devicePixelRatio = window.devicePixelRatio || 1;

let isDragging = false;
let lastX = 0;
let lastY = 0;
let currentX = 0;
let currentY = 0;

let zoom = 17;
updateZoomDisplay();

fetch("./5502.pbf").then(file => file.arrayBuffer()).then(buf => {
  var pbf = new Pbf(buf);
  var obj = Tile.read(pbf);
  console.log({obj});
})

const ways = json.elements.filter(el => el.type === "way" && el.tags !== undefined && !el.tags.landuse && !el.tags.boundary && el.tags.university !== "campus" && el.tags.amenity !== "school" && el.tags.highway !== "pedestrian" && el.tags.railway !== "razed");
const nodes = json.elements.filter(el => el.type === "node");

const enhanceLocations = (way) => ({
  ...way,
  node_locations: way.nodes.map(node_id => nodes.find(node => node.id === node_id))
})

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let lat = urlParams.get("lat") ?? 50.778845;
let lon = urlParams.get("lon") ?? 6.078324;
updateLatLonDisplay();

const isClosedWay = (way) => way.nodes[0] === way.nodes[way.nodes.length - 1] || way.tags.area === "yes";
const isOpenWay = (way) => way.nodes[0] !== way.nodes[way.nodes.length - 1];

const wayCoords = ways
  .filter(way => way.tags.area !== "yes")
  .filter(shouldRenderFeature)
  .map(enhanceLocations);

// Process Closed Ways
const areaCoords = ways
  .filter(isClosedWay)
  .map(enhanceLocations)
  .map(way => {
    const node_locations = way.node_locations.slice(0, -1).map(({lat, lon}) => [lat, lon])
    // const delaunay = new Delaunator(node_locations.flat());
    return {
      ...way,
      positions: node_locations,
      indices: earcut(node_locations.flat())
    }
  });

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

const positionsBuffer = regl.buffer([]);
const colorBuffer = regl.buffer([]);
const widthsBuffer = regl.buffer([]);
const indicesBuffer = regl.elements([]);

let wayPositionsCount = 0;
const wayPositionsBuffer = regl.buffer([]);
const wayColorBuffer = regl.buffer([]);

const renderWays = WayRenderer(regl, 3);
const renderPolygons = PolygonRenderer(regl);

const reprojectGeometries = () => {
  let positions = [];
  let colors = [];
  let indices = [];
 
  areaCoords.forEach(area => {
    const offset = positions.length;
    positions.push(...area.positions.map(([lat, lon]) => project({lat, lon}, zoom)));
    indices.push(...area.indices.map(index => index + offset));
    colors.push(...area.positions.map(_ => areaColor(area)));
  })
  positionsBuffer({
    data: positions
  })
  indicesBuffer({
    data: new Uint32Array(indices)
  })
  colorBuffer({
    data: colors
  })

  const widths = [];
  positions = [];
  colors = [];
  wayCoords.forEach(way => {
    positions.push(...way.node_locations.map(({lat, lon}) => project({lat, lon}, zoom)), 0)
    colors.push(...way.node_locations.map(_ => wayColor(way)), 0);
    widths.push(...way.node_locations.map(_ => wayWidth(way)), 0);
  })
  wayPositionsBuffer({
    data: positions
  });
  wayColorBuffer({
    data: colors
  });
  widthsBuffer({
    data: widths
  })
  wayPositionsCount = positions.length - 1;
}

document.addEventListener("wheel", (e) => {
  zoom += e.deltaY * -0.005;
  zoom = Math.max(zoom, 15);
  zoom = Math.min(zoom, 21);
  updateZoomDisplay();
  reprojectGeometries();
})

document.addEventListener("mousedown", (e) => {
  isDragging = true;
  document.body.style.cursor = "grabbing";
  currentX = e.clientX * devicePixelRatio;
  currentY = e.clientY * devicePixelRatio;
});

document.addEventListener("mouseup", (e) => {
  isDragging = false;
  document.body.style.cursor = "grab";
})

document.addEventListener("mouseout", (e) => {
  isDragging = false;
  document.body.style.cursor = "grab";
})

document.addEventListener("mousemove", (e) => {
  if(isDragging) {
    lastX = currentX;
    lastY = currentY;

    currentX = e.clientX * devicePixelRatio;
    currentY = e.clientY * devicePixelRatio;

    const dx = currentX - lastX;
    const dy = currentY - lastY;

    lat += dy * groundResolution(lat, zoom) / 111111;
    lon -= dx / Math.pow(2, zoom);
    updateLatLonDisplay();

    e.preventDefault();
  }
})

reprojectGeometries();
regl.frame(({time}) => {
  stats.begin();

  // Fade out zoom amount
  scrollY *= 0.01;
  if(scrollY < 0.1) {
    scrollY = 0;
  }

  // Clear Screen Color
  regl.clear({
    color: [0.90980392, 0.89803922, 0.84705882, 1],
    depth: 1
  })

  // Construct View Matrix at view center, looking at view center
  const [centerX, centerY] = project({lat, lon}, zoom);
  const view = mat4.lookAt(mat4.create(), [centerX + canvas.width/2, centerY + canvas.height/2, 1], [centerX + canvas.width/2, centerY + canvas.height/2, 0], [0,-1,0]);

  renderPolygons({
    positions: positionsBuffer,
    indices: indicesBuffer,
    color: colorBuffer,
    projection,
    view,
    viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height }
  })
  renderWays({
      points: wayPositionsBuffer,
      color: wayColorBuffer,
      widths: widthsBuffer,
      projection,
      view,
      viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      segments: wayPositionsCount
  });
  stats.end();
})

export function initialize() {
  document.body.style.margin = "0px";
  document.body.parentElement.style.height = "100%";
  document.body.style.width = document.body.style.height = "100%";
  document.body.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.style.width = canvas.style.height = "100%";
  document.body.appendChild(canvas);

  canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
  canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);

  const regl = REGL({
    canvas,
    attributes: {
      antialias: true
    },
    extensions: ["ANGLE_instanced_arrays", "OES_element_index_uint"]
  });

  return {
    canvas,
    regl
  };
}