export const drawPolygon = () => regl({
    vert: `
        precision highp float;
        attribute vec3 position;
        attribute vec3 color;
        uniform mat4 projection;
        uniform mat4 view;

        varying vec3 vColor;

        void main() {
            vColor = color;

            gl_Position = projection * view * vec4(position, 1);
        }`,

    frag: `
        precision highp float;

        varying vec3 vColor;

        void main() {
            gl_FragColor = vec4(vColor.xyz,1);
        }`,

    attributes: {
        position: (new Array(5)).fill().map((x, i) => {
            var theta = 2.0 * Math.PI * i / 5
            return [ Math.sin(theta), Math.cos(theta) ]
        })
    },

    uniforms: {
        color: [0.8, 1, 0.8, 1]
    },

    elements: [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 3],
        [2, 4],
        [3, 4]
    ],
});