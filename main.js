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
    positionsBuffer: regl.buffer(instanceRoundRound),
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
      attribute vec3 color;
      attribute float width;
      uniform mat4 projection;
      uniform mat4 view;

      varying vec3 vColor;
  
      void main() {
        vec2 xBasis = normalize(pointB - pointA);
        vec2 yBasis = vec2(-xBasis.y, xBasis.x);
        vec2 offsetA = pointA + width * (position.x * xBasis + position.y * yBasis);
        vec2 offsetB = pointB + width * (position.x * xBasis + position.y * yBasis);
        vec2 point = mix(offsetA, offsetB, position.z);

        vColor = color;

        gl_Position = projection * view * vec4(point, 0, 1);
      }`,

    frag: `
      precision highp float;

      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor.xyz,1);
      }`,

    attributes: {
      position: {
        buffer: roundCapJoin.positionsBuffer
      },
      color: {
        buffer: regl.prop("color"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0
      },
      width: {
        buffer: regl.prop("widths"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0
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

diagonalDemo(
  function(params) {
    return {
      interleavedStripRoundCapJoin: interleavedStripRoundCapJoin(params.regl, 3)
    };
  },
  function(params) {
    params.context.interleavedStripRoundCapJoin({
      points: params.positionsBuffer,
      color: params.colorBuffer,
      widths: params.widthsBuffer,
      projection: params.projection,
      view: params.view,
      viewport: params.viewport,
      segments: params.pointData.length - 1
    });
  }
);
