import REGL from "regl";
import { mat4 } from "gl-matrix";
import Stats from "stats.js";
import Delaunator from 'delaunator';

import json from "./aachen.json";
import { formatToPoint, groundResolution } from "./mercator";

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

const wayColor = (way) => {
  if(["primary", "primary_link"].includes(way.tags.highway)) {
    return [0.98823529, 0.83921569, 0.64313725];
  }

  if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "unclassified", "pedestrian"].includes(way.tags.highway)) {
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

  if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "primary_link"].includes(way.tags.highway)) {
    return 12;
  }

  if(["footway", "steps"].includes(way.tags.highway)) {
    return 2;
  }

  if(["service", "pedestrian"].includes(way.tags.highway)) {
    return 7;
  }

  if(["rail"].includes(way.tags.railway)) {
    return 3;
  }

  return 7;
}

const ways = json.elements.filter(el => el.type === "way");
const nodes = json.elements.filter(el => el.type === "node");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let lat = urlParams.get("lat") ?? 50.782366;
let lon = urlParams.get("lon") ?? 6.083527;
updateLatLonDisplay();

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

const wayCoords = ways.filter(way => rendered_highways.includes(way.tags.highway) || way.tags.railway === "rail").map(way => ({
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
    const view = mat4.lookAt(mat4.create(), [centerX + canvas.width/2, centerY + canvas.height/2, 1], [centerX + canvas.width/2, centerY + canvas.height/2, 0], [0,-1,0]);

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