/**
 * ============================================================================
 * ORÇUN ÇAKAR — ARTISTIC WATERCOLOR FLUID SIMULATION (SULU BOYA DİNAMİĞİ)
 * Multi-Color Wet Watercolor Bleed & Marbling on Canvas
 * Instant Startup • Navier-Stokes WebGL Shaders • Zero-Lag Interaction
 * ============================================================================
 */

(function () {
    'use strict';

    const canvas = document.getElementById('fluid-canvas') || document.getElementById('neural-canvas');
    if (!canvas) return;

    // Hareket azaltma tercihi açıkken simülasyonu hiç başlatma: WebGL bağlamı
    // bile oluşturulmaz, yerine CSS tarafındaki sabit gradyan görünür.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        canvas.classList.add('fluid-static');
        return;
    }

    // Simulation Configuration (Organic Wet Watercolor Diffusion)
    const config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 512,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 2.0, // Smooth, organic watercolor diffusion
        VELOCITY_DISSIPATION: 1.5, // Fluid, natural fluid glide
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 24, // Organic watercolor eddies & marbling
        SPLAT_RADIUS: 0.13, // Soft watercolor brush stroke width
        SPLAT_FORCE: 3000, // Gentle, responsive fluid physics
        SHADING: true,
        COLORFUL: true,
        PAUSED: false,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        TRANSPARENT: true
    };

    const { gl, ext } = getWebGLContext(canvas);

    if (!gl) {
        console.warn("WebGL not supported for fluid simulation.");
        return;
    }

    if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 256;
        config.SHADING = false;
    }

    function getWebGLContext(targetCanvas) {
        const params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
            premultipliedAlpha: true
        };

        let gl = targetCanvas.getContext('webgl2', params);
        const isWebGL2 = !!gl;
        if (!gl) {
            gl = targetCanvas.getContext('webgl', params) || targetCanvas.getContext('experimental-webgl', params);
        }

        if (!gl) return { gl: null, ext: {} };

        let halfFloat;
        let supportLinearFiltering;

        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE);
        let formatRGBA, formatRG, formatR;

        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering
            }
        };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
        if (!type) type = gl.UNSIGNED_BYTE;
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(fbo);

        if (status === gl.FRAMEBUFFER_COMPLETE) {
            return { internalFormat, format };
        }
        return { internalFormat: gl.RGBA, format: gl.RGBA };
    }

    // Material & Program Helpers
    class Material {
        constructor(vertexShader, fragmentShaderSource) {
            this.vertexShader = vertexShader;
            this.fragmentShaderSource = fragmentShaderSource;
            this.programs = [];
            this.activeProgram = null;
            this.uniforms = [];
        }

        setKeywords(keywords) {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++) hash += keywords[i].charCodeAt(0);
            let program = this.programs[hash];
            if (program == null) {
                let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                program = createProgram(this.vertexShader, fragmentShader);
                this.programs[hash] = program;
            }
            if (program === this.activeProgram) return;
            this.uniforms = getUniforms(program);
            this.activeProgram = program;
        }

        bind() {
            gl.useProgram(this.activeProgram);
        }
    }

    class Program {
        constructor(vertexShader, fragmentShader) {
            this.uniforms = {};
            this.program = createProgram(vertexShader, fragmentShader);
            this.uniforms = getUniforms(this.program);
        }
        bind() {
            gl.useProgram(this.program);
        }
    }

    function createProgram(vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }

    function getUniforms(program) {
        let uniforms = [];
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }

    function compileShader(type, source, keywords) {
        source = addKeywords(source, keywords);
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    function addKeywords(source, keywords) {
        if (keywords == null) return source;
        let keywordsString = '';
        keywords.forEach(keyword => {
            keywordsString += '#define ' + keyword + '\n';
        });
        return keywordsString + source;
    }

    // GLSL Shaders
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;

        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `);

    const clearShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;

        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `);

    // True Watercolor Marbling & Pigment Wash Shader (Sulu Boya & Ebru Efekti)
    const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform float isLight;

        // Pastel Watercolor Spectrum (Rose, Amber, Viridian, Sky Turquoise, Lavender)
        vec3 watercolorPalette(float t) {
            vec3 a = vec3(0.68, 0.65, 0.66);
            vec3 b = vec3(0.42, 0.38, 0.40);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.05, 0.38, 0.70);
            return a + b * cos(6.2831853 * (c * t + d));
        }

        void main () {
            vec4 dye = texture2D(uTexture, vUv);
            vec3 c = dye.rgb;
            float density = length(c);

            if (density < 0.0008) {
                gl_FragColor = vec4(0.0);
                return;
            }

            // Neighboring texel gradients for capillary watercolor pigment edges
            float L = length(texture2D(uTexture, vL).rgb);
            float R = length(texture2D(uTexture, vR).rgb);
            float T = length(texture2D(uTexture, vT).rgb);
            float B = length(texture2D(uTexture, vB).rgb);
            vec2 grad = vec2(R - L, T - B);
            float edgeFringe = length(grad) * 2.8;

            // Fluid hue angle & watercolor color bleed
            float hue = atan(c.g - c.b, c.r - c.g) * 0.1591549 + 0.5;
            float phase = fract(hue + density * 0.65 + edgeFringe * 0.4);
            vec3 watercolor = watercolorPalette(phase);

            // Blend pure pigment with watercolor spectral bleed
            vec3 pigmentColor = mix(c * 1.1, watercolor * 1.3, 0.7);

            if (isLight > 0.5) {
                // Light mode: Soft wet watercolor wash on white paper
                // Airy center with delicate pigment accumulation along ridges
                float alpha = clamp(density * 0.52 + edgeFringe * 0.22, 0.0, 0.46);
                gl_FragColor = vec4(pigmentColor * alpha, alpha);
            } else {
                // Dark mode: Luminous glowing watercolor nebula
                float alpha = clamp(density * 0.58 + edgeFringe * 0.25, 0.0, 0.52);
                gl_FragColor = vec4(pigmentColor * 1.15 * alpha, alpha);
            }
        }
    `;

    const splatShader = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `);

    const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;

        void main () {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }
    `, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;

            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }

            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `);

    const curlShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `);

    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;

        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;

            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;

            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            velocity = min(max(velocity, -1000.0), 1000.0);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `);

    const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;

        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `);

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B) * 0.5;
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `);

    // Programs
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    // Quad Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Framebuffer Structures
    let dye, velocity, divergence, curl, pressure;

    function initFramebuffers() {
        let simRes = getResolution(config.SIM_RESOLUTION);
        let dyeRes = getResolution(config.DYE_RESOLUTION);

        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA;
        const rg = ext.formatRG;
        const r = ext.formatR;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        if (!dye) {
            dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        } else {
            dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        }

        if (!velocity) {
            velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        } else {
            velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        }

        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function getResolution(resolution) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
        let min = Math.round(resolution);
        let max = Math.round(resolution * aspectRatio);
        if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
            return { width: max, height: min };
        } else {
            return { width: min, height: max };
        }
    }

    function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX: 1.0 / w,
            texelSizeY: 1.0 / h,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);
        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() { return fbo1; },
            set read(value) { fbo1 = value; },
            get write() { return fbo2; },
            set write(value) { fbo2 = value; },
            swap() {
                let temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            }
        };
    }

    function resizeFBO(target, w, h, internalFormat, format, type, param) {
        let newFBO = createFBO(w, h, internalFormat, format, type, param);
        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, 1);
        blit(newFBO);
        return newFBO;
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        if (target.width === w && target.height === h) return target;
        target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
    }

    function blit(target) {
        if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    // Curated Wet Watercolor Pigment Palette
    let colorStep = 0;
    const watercolorPalette = [
        { r: 0.96, g: 0.25, b: 0.58 }, // Rose Magenta Watercolor
        { r: 0.98, g: 0.78, b: 0.15 }, // Cadmium Amber Gold
        { r: 0.18, g: 0.88, b: 0.48 }, // Viridian Mint Lime
        { r: 0.08, g: 0.82, b: 0.96 }, // Turquoise Cerulean
        { r: 0.68, g: 0.30, b: 0.94 }, // Orchid Lavender
        { r: 0.98, g: 0.44, b: 0.20 }, // Peach Coral
        { r: 0.12, g: 0.90, b: 0.72 }, // Emerald Seafoam
        { r: 0.24, g: 0.58, b: 0.98 }  // Cobalt Sky Blue
    ];

    function generateColor() {
        colorStep = (colorStep + 1) % watercolorPalette.length;
        const c = watercolorPalette[colorStep];
        return {
            r: c.r * 0.9,
            g: c.g * 0.9,
            b: c.b * 0.9
        };
    }

    function splat(x, y, dx, dy, color) {
        splatProgram.bind();
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.point, x, y);
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        blit(dye.write);
        dye.swap();
    }

    function correctRadius(radius) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
    }

    function step(dt) {
        gl.disable(gl.BLEND);

        // 1. Curl
        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        // 2. Vorticity Confinement
        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        // 3. Divergence
        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        // 4. Clear Pressure
        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        // 5. Pressure Solver (Jacobi)
        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
            blit(pressure.write);
            pressure.swap();
        }

        // 6. Gradient Subtract
        gradienSubtractProgram.bind();
        gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        // 7. Advect Velocity
        advectionProgram.bind();
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        if (!ext.supportLinearFiltering) {
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        let velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        // 8. Advect Dye (Watercolor Bleed)
        if (!ext.supportLinearFiltering) {
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        }
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();
    }

    function render() {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        displayMaterial.setKeywords([]);
        displayMaterial.bind();
        const isLight = document.body.classList.contains('light-theme') ? 1.0 : 0.0;
        gl.uniform1f(displayMaterial.uniforms.isLight, isLight);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        blit(null);
    }

    // Universal, Robust Instant Pointer Tracking (Zero Startup Lag)
    let lastClientX = null;
    let lastClientY = null;

    function handlePointerMove(clientX, clientY) {
        // Only ignore if user has scrolled far down past hero
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const heroHeight = canvas.clientHeight || window.innerHeight || 800;
        if (scrollY > heroHeight) {
            lastClientX = null;
            lastClientY = null;
            return;
        }

        const width = canvas.width || window.innerWidth;
        const height = canvas.height || window.innerHeight;

        const currX = clientX / width;
        const currY = 1.0 - clientY / height;

        if (lastClientX === null || lastClientY === null) {
            lastClientX = currX;
            lastClientY = currY;
            return;
        }

        let deltaX = (currX - lastClientX) * config.SPLAT_FORCE;
        let deltaY = (currY - lastClientY) * config.SPLAT_FORCE;

        deltaX = Math.max(-1300, Math.min(1300, deltaX));
        deltaY = Math.max(-1300, Math.min(1300, deltaY));

        const distSq = deltaX * deltaX + deltaY * deltaY;
        if (distSq > 1.0) {
            const col = generateColor();
            splat(currX, currY, deltaX, deltaY, col);

            lastClientX = currX;
            lastClientY = currY;
        }
    }

    window.addEventListener('mousemove', e => {
        handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener('mousedown', e => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const heroHeight = canvas.clientHeight || window.innerHeight || 800;
        if (scrollY > heroHeight) return;

        const width = canvas.width || window.innerWidth;
        const height = canvas.height || window.innerHeight;
        let posX = e.clientX / width;
        let posY = 1.0 - e.clientY / height;
        const c = generateColor();
        splat(posX, posY, (Math.random() - 0.5) * 350, (Math.random() - 0.5) * 350, c);
    });

    // Auto Ambient Swirls (Gentle Idle Motion)
    let lastAmbient = Date.now();
    function autoAmbient() {
        const now = Date.now();
        if (now - lastAmbient > 3800) {
            lastAmbient = now;
            const x = 0.25 + Math.random() * 0.5;
            const y = 0.35 + Math.random() * 0.4;
            const angle = Math.random() * Math.PI * 2;
            const speed = 75 + Math.random() * 85;
            const c = generateColor();
            splat(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, c);
        }
    }

    // Resize Handler
    function resizeCanvas() {
        let width = canvas.clientWidth || window.innerWidth;
        let height = canvas.clientHeight || window.innerHeight;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            initFramebuffers();
        }
    }

    // Animation Loop
    let lastTime = Date.now();
    let isRunning = false;
    let isHeroInView = true;

    function update() {
        if (!isRunning) return;

        const now = Date.now();
        let dt = (now - lastTime) / 1000.0;
        dt = Math.min(dt, 0.033);
        lastTime = now;

        autoAmbient();
        step(dt);
        render();

        requestAnimationFrame(update);
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        lastTime = Date.now();
        update();
    }

    function stop() {
        isRunning = false;
    }

    // IntersectionObserver
    const heroSection = document.getElementById('home');
    if ('IntersectionObserver' in window && heroSection) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isHeroInView = entry.isIntersecting;
                if (isHeroInView) start();
                else stop();
            });
        }, { threshold: 0.01, rootMargin: '300px 0px 300px 0px' });
        observer.observe(heroSection);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (isHeroInView) start();
    });

    window.addEventListener('resize', resizeCanvas);

    // Initial Splash & Guaranteed Immediate Execution
    // Bu fonksiyon dört ayrı olaydan çağrılıyor; ilk damlalar yalnızca bir kez
    // atılsın diye bayrakla korunuyor. resizeCanvas ucuz: boyut değişmediyse
    // framebuffer'ları yeniden ayırmıyor.
    let simulationInitialized = false;

    function initSimulation() {
        resizeCanvas();

        if (!simulationInitialized) {
            simulationInitialized = true;
            // Gentle initial watercolor swirl
            splat(0.48, 0.52, 110, 60, watercolorPalette[0]);
            splat(0.52, 0.48, -100, 70, watercolorPalette[3]);
        }

        if (isHeroInView && !document.hidden) start();
    }

    // Immediately start without waiting for deferred layout
    initSimulation();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSimulation, 30);
        });
    } else {
        setTimeout(initSimulation, 30);
    }
    window.addEventListener('load', initSimulation);
    window.addEventListener('pageshow', initSimulation);

})();
