import REGL from "regl";
import { mat4 } from "gl-matrix";
import Stats from "stats.js";
import earcut from "earcut";

import { groundResolution, project } from "./src/projection/mercator";
import { areaColor, wayColor, wayWidth } from "./src/style/mapStyle";
import { WayRenderer } from "./src/renderer/WayRenderer";
import { PolygonRenderer } from "./src/renderer/PolygonRenderer";
import { leafletRasterLayer, PMTiles } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";

const updateLatLonDisplay = () => document.getElementById("coords").innerHTML = `Center ${lat.toFixed(6)}/${lon.toFixed(6)}`;
const updateZoomDisplay = () => document.getElementById("zoom").innerHTML = `Zoom ${zoom.toFixed(4)}`;

const devicePixelRatio = window.devicePixelRatio || 1;

let isDragging = false;
let lastX = 0;
let lastY = 0;
let currentX = 0;
let currentY = 0;

let zoom = 16.5;
updateZoomDisplay();

let wayCoords = [];
let areaCoords = [];

let instance = new PMTiles("./Aachen.pmtiles");
instance.getHeader().then((h) => {
  let x = 8470;
  let y = 5501;
  let z = 14;

  const controller = new AbortController();
  const signal = controller.signal;
  let cancel = () => {
    controller.abort();
  };

  instance.getZxy(+z, +x, +y, signal).then(resp => {
    let tile = new VectorTile(new Pbf(new Uint8Array(resp.data)));

    let newLayers = [];
    for (let [name, layer] of Object.entries(tile.layers)) {
      let features = [];
      let type;
      for (var i = 0; i < layer.length; i++) {
        let feature = layer.feature(i);

        let { properties, id } = feature;
        let { geometry } = feature.toGeoJSON(x, y, z);

        type = geometry.type;

        if(geometry.type === "Polygon") {
          features.push({
            type: name,
            id,
            properties,
            locations: geometry.coordinates.flat()
          });
        } else if (geometry.type === "LineString") {
          features.push({
            type: name,
            id,
            properties,
            locations: geometry.coordinates
          });
        }
      }
      newLayers.push({ features: features, name: name, type });
    }
    newLayers.sort(smartCompare);
    
    newLayers.filter(layer => layer.type === "Polygon" && !["roads", "earth", "natural", "mask"].includes(layer.name)).forEach(layer => {
      layer.features.forEach(feature => {
        areaCoords.push({
          ...feature,
          indices: earcut(feature.locations.flat())
        })
      })
    })

    newLayers.filter(layer => layer.type === "LineString").forEach(layer => {
      layer.features.sort((fa, fb) => wayWidth(fa) - wayWidth(fb)).forEach(feature => {
        wayCoords.push(feature)
      })
    })

    reprojectGeometries();
  });
});

let smartCompare = (a, b) => {
  if (a.name === "earth") return -4;
  if (a.name === "water") return -3;
  if (a.name === "natural") return -2;
  if (a.name === "landuse") return -1;
  if (a.name === "places") return 1;
  return 0;
};

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let lat = urlParams.get("lat") ?? 50.771217;
let lon = urlParams.get("lon") ?? 6.119103;

updateLatLonDisplay();

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

  const [centerX, centerY] = project({lat, lon}, zoom);
 
  areaCoords.forEach(area => {
    const offset = positions.length;
    positions.push(...area.locations.map(([lon, lat]) => {
      const [projectedX, projectedY] = project({lat, lon}, zoom)
      return [
        projectedX - centerX,
        projectedY - centerY
      ];
    }));
    indices.push(...area.indices.map(index => index + offset));
    colors.push(...area.locations.map(_ => areaColor(area)));
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
    positions.push(...way.locations.map(([lon, lat]) => {
      const [projectedX, projectedY] = project({lat, lon}, zoom)
      return [
        projectedX - centerX,
        projectedY - centerY
      ];
    }), 0)
    colors.push(...way.locations.map(_ => wayColor(way)), 0);
    widths.push(...way.locations.map(_ => wayWidth(way)), 0);
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
    reprojectGeometries();

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

  const view = mat4.lookAt(mat4.create(), [canvas.width/2, canvas.height/2, 1], [canvas.width/2, canvas.height/2, 0], [0,-1,0]);

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
      segments: wayPositionsCount,
      zoomLevel: zoom
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