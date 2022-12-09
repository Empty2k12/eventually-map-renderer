export const PolygonRenderer = (regl) => regl({
    vert: `
        precision highp float;
        
        attribute vec2 position;
        attribute float color;

        uniform mat4 projection;
        uniform mat4 view;

        varying float vColor;

        void main() {
            vColor = color;
            gl_Position = projection * view * vec4(position, 1, 1);
        }`,

    frag: `
        precision highp float;

        varying float vColor;

        void main() {
            if(vColor == 0.9) {
                gl_FragColor = vec4(0.90980392, 0.89803922, 0.84705882, 1); // beige
            } else if(vColor == 0.85) {
                gl_FragColor = vec4(0.6666666666666666, 0.8274509803921568, 0.8745098039215686, 1); // blue
            } else if(vColor == 0.8) {
                gl_FragColor = vec4(0.83921569, 0.8745098, 0.73333333, 1); // green
            } else if(vColor == 0.55) {
                gl_FragColor = vec4(0.9215686274509803, 0.8588235294117647, 0.9098039215686274, 1); // pink
            } else if(vColor == 0.5) {
                gl_FragColor = vec4(0.87058824, 0.82745098, 0.74509804, 1); // beige
            } else if(vColor == 0.3) {
                gl_FragColor = vec4(0.9333, 0.9333, 0.9333, 1); //gray
            } else if(vColor == 0.1) {
                gl_FragColor = vec4(1, 1, 0.9, 1); // yellow
            } else {
                gl_FragColor = vec4(1, 1, 1, 1); // white
            }
        }`,

    attributes: {
        position: regl.prop("positions"),
        color: {
            buffer: regl.prop("color"),
            offset: Float32Array.BYTES_PER_ELEMENT * 0
        },
    },

    uniforms: {
        projection: regl.prop("projection"),
        view: regl.prop("view")
    },

    elements: regl.prop("indices"),
});