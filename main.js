import { diagonalDemo } from "./demo"

const segmentInstanceGeometry = [
  [0, -0.5],
  [1, -0.5],
  [1, 0.5],
  [0, -0.5],
  [1, 0.5],
  [0, 0.5]
];

function interleavedStrip(regl) {
  return regl({
    vert: `
      precision highp float;
      attribute vec2 position;
      attribute vec2 pointA, pointB;
      uniform float width;
      uniform mat4 projection;
      uniform mat4 view;
  
      void main() {
        vec2 xBasis = pointB - pointA;
        vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
        vec2 point = pointA + xBasis * position.x + yBasis * width * position.y;
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
        buffer: regl.buffer(segmentInstanceGeometry),
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

    cull: {
      enable: true,
      face: "back"
    },

    depth: {
      enable: false
    },

    count: segmentInstanceGeometry.length,
    instances: regl.prop("segments"),
    viewport: regl.prop("viewport")
  });
}

let instanceBevelJoin = [[0, 0], [1, 0], [0, 1]];

function bevelJoin(regl) {
  return regl({
    vert: `
    precision highp float;
    attribute vec2 pointA, pointB, pointC;
    attribute vec2 position;
    uniform float width;
    uniform mat4 projection;
    uniform mat4 view;

    void main() {
      vec2 tangent = normalize(normalize(pointC - pointB) + normalize(pointB - pointA));
      vec2 normal = vec2(-tangent.y, tangent.x);
      vec2 ab = pointB - pointA;
      vec2 cb = pointB - pointC;
      float sigma = sign(dot(ab + cb, normal));
      vec2 abn = normalize(vec2(-ab.y, ab.x));
      vec2 cbn = -normalize(vec2(-cb.y, cb.x));
      vec2 p0 = 0.5 * sigma * width * (sigma < 0.0 ? abn : cbn);
      vec2 p1 = 0.5 * sigma * width * (sigma < 0.0 ? cbn : abn);
      vec2 point = pointB + position.x * p0 + position.y * p1;
      gl_Position = projection * view * vec4(point, 0, 1);
    }`,

    frag: `
    precision highp float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`,

    depth: {
      enable: false
    },

    attributes: {
      position: {
        buffer: regl.buffer(instanceBevelJoin),
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
      },
      pointC: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4
      }
    },

    uniforms: {
      width: regl.prop("width"),
      color: regl.prop("color"),
      projection: regl.prop("projection"),
      view: regl.prop("view")
    },

    cull: {
      enable: true,
      face: "back"
    },

    count: instanceBevelJoin.length,
    instances: regl.prop("instances"),
    viewport: regl.prop("viewport")
  });
}

const wayWidth = (way) => {
  if(["residential", "primary"].includes(way.tags.highway)) {
    return 15;
  }

  if(way.tags.highway === "footway") {
    return 2;
  }

  if(way.tags.highway === "service") {
    return 5;
  }

  return 10;
}

const wayColor = (way) => {
  if(["residential", "primary"].includes(way.tags.highway)) {
    return [0,0,0,1];
  }

  if(way.tags.highway === "footway") {
    return [1,0,0,1];
  }

  if(way.tags.highway === "service") {
    return [0.4,0.4,0.4,1];
  }

  return [0,0,0,1];
}

diagonalDemo(
  function(params) {
    return {
      interleavedStrip: interleavedStrip(params.regl),
      bevelJoin: bevelJoin(params.regl)
    };
  },
  function(params) {
    params.context.interleavedStrip({
      points: params.buffer,
      width: wayWidth(params.way),
      color: wayColor(params.way),
      projection: params.projection,
      view: params.view,
      viewport: params.viewport,
      segments: params.pointData.length - 1
    });
    params.context.bevelJoin({
      points: params.buffer,
      width: wayWidth(params.way),
      color: [1, 0, 0, 1],
      projection: params.projection,
      view: params.view,
      viewport: params.viewport,
      instances: params.pointData.length - 2
    });
  }
);
