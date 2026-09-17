/**
 * ============================================================================
 * ORÇUN ÇAKAR — ARTISTIC WATERCOLOR FLUID SIMULATION (SULU BOYA DİNAMİĞİ)
 * Multi-Color Wet Watercolor Bleed & Marbling on Canvas
 * Instant Startup • Navier-Stokes WebGL Shaders • Zero-Lag Interaction
 * ============================================================================
 */

(async function () {
    'use strict';

    const canvas = document.getElementById('fluid-canvas');
    if (!canvas) return;

    // Hareket azaltma tercihi açıkken simülasyonu hiç başlatma: WebGL bağlamı
    // bile oluşturulmaz, yerine CSS tarafındaki sabit gradyan görünür.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        canvas.classList.add('fluid-static');
        return;
    }

    // Telefon ve tabletlerde WebGL sik sik yazilimla ciziliyor; surekli donen
    // simulasyon ana is parcacigini dolduruyor ve pil tuketiyor. Hareket
    // azaltma yolundaki ayni sabit gradyana dusuyoruz, renkler degismiyor.
    const kucukEkran = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    const kabaIsaretci = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (kucukEkran || kabaIsaretci) {
        canvas.classList.add('fluid-static');
        return;
    }

    // Masaustunde de WebGL yazilimla cizilebiliyor: surucusu olmayan makineler,
    // uzak masaustu oturumlari, sanal sunucular ve olcum ortamlari. Orada ayni
    // dongu ana is parcacigini kilitliyor -- PageSpeed'in GPU'suz sunucusunda
    // TBT 9,3 sn olculdu, gercek GPU'lu tarayicida ayni sayfada 9 saniye boyunca
    // tek bir uzun gorev bile cikmiyor. Yani maliyet kodun agirligi degil,
    // yazilim cizici. Surucu adi yazilim cizici diyorsa telefondakiyle ayni
    // sabit gradyana dusuyoruz; ekran karti olan ziyaretcide hicbir sey degismez.
    // Tespit asil baglam uzerinde yapiliyor: eskiden ayri bir deneme baglami
    // aciliyordu ve soguk tarayicida o tek baglam ~500ms ana is parcacigini kilitliyordu.
    function yazilimCizici(gl) {
        try {
            const bilgi = gl.getExtension('WEBGL_debug_renderer_info');
            const adlar = [];
            if (bilgi) adlar.push(gl.getParameter(bilgi.UNMASKED_RENDERER_WEBGL));
            adlar.push(gl.getParameter(gl.RENDERER));
            const ad = adlar.filter(Boolean).join(' ');
            if (!ad) return false; // Ad gizlenmisse mevcut davranisi bozma
            return /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(ad);
        } catch (e) {
            return false; // Tespit edemedik: eskisi gibi calis
        }
    }

    function sabitGradyanaDus(gl) {
        if (gl) {
            const kaybet = gl.getExtension('WEBGL_lose_context');
            if (kaybet) kaybet.loseContext();
        }
        canvas.classList.add('fluid-static');
    }

    // Kurulum (baglam, shader'lar, framebuffer'lar) tek parca halinde acilista
    // 175-670ms ana is parcacigini kilitliyordu. Sayfa yuklendikten sonra
    // bos anlara bolunuyor; animasyon biraz gec basliyor, sayfa donmuyor.
    function bosZaman() {
        return new Promise(r => {
            if ('requestIdleCallback' in window) requestIdleCallback(() => r(), { timeout: 1000 });
            else setTimeout(r, 50);
        });
    }

    if (document.readyState !== 'complete') {
        await new Promise(r => window.addEventListener('load', r, { once: true }));
    }
    await bosZaman();

    // Ayarlar ve davranis aaabadcode.com'daki efektle (React Bits SplashCursor) ayni
    const config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1440,
        DENSITY_DISSIPATION: 0.5, // Boya saniyelerce kaliyor
        VELOCITY_DISSIPATION: 3.0, // Hareket hizla duruluyor: savrulma degil, duran boya
        PRESSURE: 0.1,
        PRESSURE_ITERATIONS: 20,
        CURL: 3, // Neredeyse girdapsiz: ipeksi, sakin akis
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 6000,
        SHADING: true,
        COLOR_UPDATE_SPEED: 10 // Renk saniyede 10 kez degisiyor: iz boyunca gokkusagi seritleri
    };

    const { gl, ext } = getWebGLContext(canvas);

    if (!gl) {
        // WebGL hic yoksa simulasyon zaten calismaz
        sabitGradyanaDus(null);
        return;
    }

    if (yazilimCizici(gl)) {
        sabitGradyanaDus(gl);
        return;
    }

    await bosZaman();

    if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 256;
        config.SHADING = false;
    }

    // Yuksek boya cozunurlugu masaustunde ince detay veriyor ama telefonda
    // gereksiz GPU yuku; kucuk ekranlarda yariya indiriliyor.
    if (window.innerWidth < 900 || (navigator.maxTouchPoints || 0) > 0) {
        config.DYE_RESOLUTION = Math.min(config.DYE_RESOLUTION, 512);
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
        // Tek kanalli bicim desteklenmiyorsa daha genis olana gec
        if (internalFormat === gl.R16F) return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        if (internalFormat === gl.RG16F) return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
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

        // Derleyip baglar ama sonucu beklemez (uniform okumasi setKeywords'te)
        derle(keywords) {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++) hash += keywords[i].charCodeAt(0);
            if (this.programs[hash] == null) {
                let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                this.programs[hash] = createProgram(this.vertexShader, fragmentShader);
            }
            return this.programs[hash];
        }

        setKeywords(keywords) {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++) hash += keywords[i].charCodeAt(0);
            let program = this.programs[hash];
            if (program == null) program = this.derle(keywords);
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
            this.program = createProgram(vertexShader, fragmentShader);
            // Uniform okumasi baglamanin bitmesini senkron bekliyor; hazirla() ile
            // baglama bittikten sonra yapiliyor.
            this.uniforms = {};
        }
        hazirla() {
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

    // Boyayi oldugu gibi gosteriyor; SHADING acikken komsu piksellerden yuzey
    // egimi cikarilip hafif bir isik veriliyor (parlak, sivi gorunumu).
    const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform vec2 texelSize;

        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;

        #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;

            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);

            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);

            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
        #endif

            float a = max(c.r, max(c.g, c.b));
            gl_FragColor = vec4(c, a);
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

        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
            vec2 iuv = floor(st);
            vec2 fuv = fract(st);
            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }

        void main () {
        #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
        #endif
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
            velocity.xy -= vec2(R - L, T - B);
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
    const displayKeywords = config.SHADING ? ['SHADING'] : [];
    const displayProgram = displayMaterial.derle(displayKeywords);

    // KHR_parallel_shader_compile varsa derleme/baglama GPU surecinde suruyor;
    // bitene kadar ana is parcacigini birakip kareler arasinda yokla.
    const programlar = [clearProgram, splatProgram, advectionProgram, divergenceProgram, curlProgram, vorticityProgram, pressureProgram, gradienSubtractProgram];
    const paralelDerleme = gl.getExtension('KHR_parallel_shader_compile');
    if (paralelDerleme) {
        const tumu = programlar.map(p => p.program).concat(displayProgram);
        const son = performance.now() + 3000;
        while (performance.now() < son && !tumu.every(p => gl.getProgramParameter(p, paralelDerleme.COMPLETION_STATUS_KHR))) {
            await new Promise(r => setTimeout(r, 16));
        }
    }
    programlar.forEach(p => p.hazirla());
    await bosZaman();

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

    // Rastgele ton, tam doygunluk; dusuk yogunluk (0.15) sayesinde boya
    // ust uste birikse de pastel kaliyor.
    function hsvToRgb(h, s, v) {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: return { r: v, g: t, b: p };
            case 1: return { r: q, g: v, b: p };
            case 2: return { r: p, g: v, b: t };
            case 3: return { r: p, g: q, b: v };
            case 4: return { r: t, g: p, b: v };
            default: return { r: v, g: p, b: q };
        }
    }

    function generateColor() {
        const c = hsvToRgb(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
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

        displayMaterial.setKeywords(displayKeywords);
        displayMaterial.bind();
        if (config.SHADING) {
            gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
        }
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        blit(null);
    }

    // Fare olayi sadece konumu kaydediyor; boya karenin icinde, adim oncesi
    // bir kez ekleniyor. Olay sikligi ne olursa olsun iz kareyle ayni ritimde.
    const pointer = {
        texcoordX: 0,
        texcoordY: 0,
        prevTexcoordX: 0,
        prevTexcoordY: 0,
        deltaX: 0,
        deltaY: 0,
        moved: false,
        started: false,
        color: generateColor()
    };

    // Kanvas hero'nun icinde, sayfayla birlikte kayiyor. Olay koordinatlari
    // pencereye gore geldigi icin kanvasin sayfadaki yeri boyut degisince
    // olculup saklaniyor; her olayda layout okumamak icin kaydirma farki
    // scrollX/scrollY'den hesaplaniyor.
    let canvasPageLeft = 0;
    let canvasPageTop = 0;

    function olcKonum() {
        const r = canvas.getBoundingClientRect();
        canvasPageLeft = r.left + window.scrollX;
        canvasPageTop = r.top + window.scrollY;
    }

    function dpr() {
        return Math.min(window.devicePixelRatio || 1, 2);
    }

    // Kanvas koordinatina (0-1, y yukari) cevir; kanvasin disindaysa null
    function kanvasKoordinati(clientX, clientY) {
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        if (!cssW || !cssH) return null;
        const x = (clientX + window.scrollX - canvasPageLeft) / cssW;
        const y = (clientY + window.scrollY - canvasPageTop) / cssH;
        if (x < 0 || x > 1 || y < 0 || y > 1) return null;
        return { x, y: 1.0 - y };
    }

    function correctDeltaX(delta) {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }

    function correctDeltaY(delta) {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }

    function pointerDown(p) {
        pointer.texcoordX = p.x;
        pointer.texcoordY = p.y;
        pointer.prevTexcoordX = p.x;
        pointer.prevTexcoordY = p.y;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.moved = false;
        pointer.started = true;
        pointer.color = generateColor();
    }

    function pointerMove(p) {
        if (!pointer.started) {
            // Ilk olayda onceki konum yok; sicrama olmasin diye buradan basla
            pointerDown(p);
            return;
        }
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = p.x;
        pointer.texcoordY = p.y;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    window.addEventListener('mousemove', e => {
        const p = kanvasKoordinati(e.clientX, e.clientY);
        if (p) pointerMove(p);
        else pointer.started = false;
    }, { passive: true });

    window.addEventListener('mousedown', e => {
        const p = kanvasKoordinati(e.clientX, e.clientY);
        if (!p || !isRunning) return;
        pointerDown(p);
        // Tiklamada kucuk, parlak bir damla
        const c = generateColor();
        c.r *= 10.0;
        c.g *= 10.0;
        c.b *= 10.0;
        splat(p.x, p.y, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), c);
    }, { passive: true });

    // Boyut: CSS boyutu x piksel yogunlugu (keskin gorunum). Yogunluk 2 ile
    // sinirli; 3x ekranlarda fark gorunmuyor ama GPU yuku artiyor.
    function resizeCanvas() {
        olcKonum();
        const width = Math.floor((canvas.clientWidth || window.innerWidth) * dpr());
        const height = Math.floor((canvas.clientHeight || window.innerHeight) * dpr());
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            initFramebuffers();
        }
    }

    // Animation Loop
    let lastTime = Date.now();
    let colorUpdateTimer = 0.0;
    let isRunning = false;
    let isHeroInView = true;

    function update() {
        if (!isRunning) return;

        const now = Date.now();
        let dt = (now - lastTime) / 1000.0;
        dt = Math.min(dt, 0.016666);
        lastTime = now;

        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (colorUpdateTimer >= 1) {
            colorUpdateTimer = colorUpdateTimer % 1;
            pointer.color = generateColor();
        }

        if (pointer.moved) {
            pointer.moved = false;
            splat(pointer.texcoordX, pointer.texcoordY,
                pointer.deltaX * config.SPLAT_FORCE, pointer.deltaY * config.SPLAT_FORCE, pointer.color);
        }

        step(dt);
        render();

        requestAnimationFrame(update);
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        lastTime = Date.now();
        requestAnimationFrame(update);
    }

    function stop() {
        isRunning = false;
        pointer.moved = false;
        pointer.started = false;
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

    // Hero yuksekligi yazi tipi ve icerik yuklenince de degisiyor; yalnizca
    // pencere boyutunu dinlemek yetmiyor.
    // Yakinlastirma ise piksel yogunlugunu degistirip CSS boyutunu ayni
    // birakabiliyor, o yuzden resize da dinleniyor.
    if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas);
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    canvas.classList.add('fluid-canli');
    if (isHeroInView && !document.hidden) start();
    window.addEventListener('pageshow', () => {
        resizeCanvas();
        if (isHeroInView && !document.hidden) start();
    });

})();
