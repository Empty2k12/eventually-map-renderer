import { diagonalDemo } from "./demo"

function roundCapJoinGeometry(regl, resolution) {
  const instanceRoundRound = [
    [0, -0.5, 0],
    [0, -0.5, 1],
    [0, 0.5, 1],
    [0, -0.5, 0],
    [0, 0.5, 1],
    [0, 0.5, 0]
  ];
  // Add the left cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = Math.PI / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = Math.PI / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 0]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta0),
      0.5 * Math.sin(theta0),
      0
    ]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta1),
      0.5 * Math.sin(theta1),
      0
    ]);
  }
  // Add the right cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = (3 * Math.PI) / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = (3 * Math.PI) / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 1]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta0),
      0.5 * Math.sin(theta0),
      1
    ]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta1),
      0.5 * Math.sin(theta1),
      1
    ]);
  }
  return {
    buffer: regl.buffer(instanceRoundRound),
    count: instanceRoundRound.length
  };
}

function interleavedStripRoundCapJoin(regl, resolution) {
  let roundCapJoin = roundCapJoinGeometry(regl, resolution);
  return regl({
    vert: `
      precision highp float;
      attribute vec3 position;
      attribute vec2 pointA, pointB;
      uniform float width;
      uniform mat4 projection;
      uniform mat4 view;
  
      void main() {
        vec2 xBasis = normalize(pointB - pointA);
        vec2 yBasis = vec2(-xBasis.y, xBasis.x);
        vec2 offsetA = pointA + width * (position.x * xBasis + position.y * yBasis);
        vec2 offsetB = pointB + width * (position.x * xBasis + position.y * yBasis);
        vec2 point = mix(offsetA, offsetB, position.z);
        gl_Position = projection * view * vec4(point, 0, 1);
      }`,

    frag: `
      precision highp float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }`,

    attributes: {
      position: {
        buffer: roundCapJoin.buffer,
        divisor: 0
      },
      pointA: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0
      },
      pointB: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2
      }
    },

    uniforms: {
      width: regl.prop("width"),
      color: regl.prop("color"),
      projection: regl.prop("projection"),
      view: regl.prop("view")
    },

    depth: {
      enable: false
    },

    cull: {
      enable: true,
      face: "back"
    },

    count: roundCapJoin.count,
    instances: regl.prop("segments"),
    viewport: regl.prop("viewport")
  });
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

const wayColor = (way) => {
  if(["primary", "primary_link"].includes(way.tags.highway)) {
    return [0.98823529, 0.83921569, 0.64313725, 1];
  }

  if(["residential", "secondary", "tertiary", "living_street", "unclassified", "pedestrian"].includes(way.tags.highway)) {
    return [1, 1, 1, 1];
  }

  if(["footway", "steps", "cycleway"].includes(way.tags.highway)) {
    return [0.95294118, 0.60392157, 0.54117647, 1];
  }

  if(way.tags.highway === "service") {
    return [0.85,0.85,0.85,1];
  }

  return [0,0,0,1];
}

diagonalDemo(
  function(params) {
    return {
      interleavedStripRoundCapJoin: interleavedStripRoundCapJoin(params.regl, 2)
    };
  },
  function(params) {
    params.context.interleavedStripRoundCapJoin({
      points: params.buffer,
      width: wayWidth(params.way),
      color: wayColor(params.way),
      projection: params.projection,
      view: params.view,
      viewport: params.viewport,
      segments: params.pointData.length - 1
    });
  }
);
