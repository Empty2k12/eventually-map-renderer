import REGL from "regl";
import { mat4 } from "gl-matrix";
import Stats from "stats.js";
import Delaunator from 'delaunator';

import json from "./aachen2.json";
import { formatToPoint, groundResolution } from "./src/projection/mercator";
import { areaColor, wayColor, wayWidth } from "./src/style/mapStyle";
import { shouldRenderFeature } from "./src/style/featureSelector";
import { WayRenderer } from "./src/renderer/WayRenderer";
import { PolygonRenderer } from "./src/renderer/PolygonRenderer";

// https://github.com/MicrosoftDocs/azure-docs/blob/main/articles/azure-maps/zoom-levels-and-tile-grid.md

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

const ways = json.elements.filter(el => el.type === "way" && el.tags !== undefined && !el.tags.landuse);
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

const isClosedWay = (way) => way.nodes[0] === way.nodes[way.nodes.length - 1];
const isOpenWay = (way) => way.nodes[0] !== way.nodes[way.nodes.length - 1];

const wayCoords = ways
  .filter(isOpenWay)
  .map(enhanceLocations);

// Process Closed Ways
const areaCoords = ways
  .filter(isClosedWay)
  .map(enhanceLocations)
  .map(way => {
    const node_locations = way.node_locations.map(({lat, lon}) => [lat, lon])
    const delaunay = new Delaunator(node_locations.flat());
    return {
      ...way,
      positions: node_locations,
      indices: delaunay.triangles
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

const renderWays = WayRenderer(regl, 3);
const renderPolygons = PolygonRenderer(regl);

document.addEventListener("wheel", (e) => {
  zoom += e.deltaY * -0.005;
  zoom = Math.max(zoom, 15);
  zoom = Math.min(zoom, 21);
  updateZoomDisplay();
})

document.addEventListener("mousedown", (e) => {
  isDragging = true;
  currentX = e.clientX * devicePixelRatio;
  currentY = e.clientY * devicePixelRatio;
});

document.addEventListener("mouseup", (e) => {
  isDragging = false;
})

document.addEventListener("mouseout", (e) => {
  isDragging = false;
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
  const [centerX, centerY] = formatToPoint({lat, lon}, zoom);
  const view = mat4.lookAt(mat4.create(), [centerX + canvas.width/2, centerY + canvas.height/2, 1], [centerX + canvas.width/2, centerY + canvas.height/2, 0], [0,-1,0]);

  /**
   * 
   * Draw Rectangles
   * 
   */
  let positions = [];
  let colors = [];
  let indices = new Uint32Array();

  areaCoords.forEach(area => {
    const offset = positions.length;
    positions.push(...area.positions.map(([lat, lon]) => formatToPoint({lat, lon}, zoom)));
    let closedIndices2 = new Uint32Array(indices.length + area.indices.length);
    closedIndices2.set(indices, 0);
    closedIndices2.set(area.indices.map(index => index + offset), indices.length);
    indices = closedIndices2;

    colors.push(...area.positions.map(_ => areaColor(area)));
  })
  positionsBuffer({
    data: positions
  })
  indicesBuffer({
    data: indices
  })
  colorBuffer({
    data: colors
  })
  renderPolygons({
    positions: positionsBuffer,
    indices: indicesBuffer,
    color: colorBuffer,
    projection,
    view,
    viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height }
  })

  /**
   * 
   * Draw Ways
   * 
   */
  const widths = [];
  positions = [];
  colors = [];
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
  renderWays({
      points: positionsBuffer,
      color: colorBuffer,
      widths: widthsBuffer,
      projection,
      view,
      viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      segments: positions.length - 1
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