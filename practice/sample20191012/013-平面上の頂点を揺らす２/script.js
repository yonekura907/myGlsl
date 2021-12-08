
/** ===========================================================================
 * ここでは、JavaScript 側で行う処理は前のサンプルと同じ内容です。
 * 頂点シェーダ側では、頂点の座標をシェーダ側で動かす実装が入っていますので、そ
 * ちらを確認してみましょう。
 * ========================================================================= */

const MAT = new matIV(); // minMatrix.js に定義されている行列処理クラス
const QTN = new qtnIV(); // minMatrix.js に定義されているクォータニオン処理クラス

window.addEventListener('DOMContentLoaded', () => {
    let webgl = new WebGLFrame();
    webgl.init('webgl-canvas');

    webgl.load()
    .then(() => {
        webgl.setup();
        webgl.render();
    });
}, false);

class WebGLFrame {
    constructor(){
        this.canvas    = null;
        this.gl        = null;
        this.running   = false;
        this.beginTime = 0;
        this.nowTime   = 0;
        this.render    = this.render.bind(this);

        this.camera    = new InteractionCamera();
        this.mMatrix   = MAT.identity(MAT.create());
        this.vMatrix   = MAT.identity(MAT.create());
        this.pMatrix   = MAT.identity(MAT.create());
        this.vpMatrix  = MAT.identity(MAT.create());
        this.mvpMatrix = MAT.identity(MAT.create());
    }
    /**
     * WebGL を実行するための初期化処理を行う。
     * @param {HTMLCanvasElement|string} canvas - canvas への参照か canvas の id 属性名のいずれか
     */
    init(canvas){
        if(canvas instanceof HTMLCanvasElement === true){
            this.canvas = canvas;
        }else if(Object.prototype.toString.call(canvas) === '[object String]'){
            let c = document.querySelector(`#${canvas}`);
            if(c instanceof HTMLCanvasElement === true){
                this.canvas = c;
            }
        }
        if(this.canvas == null){throw new Error('invalid argument');}
        this.gl = this.canvas.getContext('webgl');
        if(this.gl == null){throw new Error('webgl not supported');}
    }
    /**
     * シェーダやテクスチャ用の画像など非同期で読み込みする処理を行う。
     * @return {Promise}
     */
    load(){
        // ロード完了後に必要となるプロパティを初期化
        this.program     = null;
        this.attLocation = null;
        this.attStride   = null;
        this.uniLocation = null;
        this.uniType     = null;

        return new Promise((resolve) => {
            this.loadShader([
                './vs1.vert',
                './fs1.frag',
            ])
            .then((shaders) => {
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                this.program = this.createProgram(vs, fs);
                // attribute 変数関係
                this.attLocation = [
                    gl.getAttribLocation(this.program, 'position'),
                    gl.getAttribLocation(this.program, 'color'),
                ];
                this.attStride = [
                    3,
                    4,
                ];
                // uniform 変数関係
                this.uniLocation = [
                    gl.getUniformLocation(this.program, 'mvpMatrix'),
                    gl.getUniformLocation(this.program, 'time'),
                ];
                this.uniType = [
                    'uniformMatrix4fv',
                    'uniform1f',
                ];

                resolve();
            });
        });
    }
    /**
     * WebGL のレンダリングを開始する前のセットアップを行う。
     */
    setup(){
        let gl = this.gl;

        // Esc キーで実行を止められるようにイベントを設定
        window.addEventListener('keydown', (evt) => {
            this.running = evt.key !== 'Escape';
        }, false);
        // マウス関連イベントの登録
        this.camera.update();
        this.canvas.addEventListener('mousedown', this.camera.startEvent, false);
        this.canvas.addEventListener('mousemove', this.camera.moveEvent, false);
        this.canvas.addEventListener('mouseup', this.camera.endEvent, false);
        this.canvas.addEventListener('wheel', this.camera.wheelEvent, false);

        // 頂点座標の定義
        const VERTEX_COUNT = 100; // 頂点の個数
        const VERTEX_WIDTH = 2.0; // 頂点が並ぶ範囲の広さ
        this.position = [];       // 頂点座標
        this.color = [];          // 頂点色
        for(let i = 0; i < VERTEX_COUNT; ++i){
            let x = i / VERTEX_COUNT;
            x = x * VERTEX_WIDTH - (VERTEX_WIDTH / 2.0);
            for(let j = 0; j < VERTEX_COUNT; ++j){
                let z = j / VERTEX_COUNT;
                z = z * VERTEX_WIDTH - (VERTEX_WIDTH / 2.0);
                this.position.push(x, 0.0, z);
                this.color.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 0.5, 1.0);
            }
        }
        this.vbo = [
            this.createVbo(this.position),
            this.createVbo(this.color),
        ];

        gl.clearColor(0.4, 0.4, 0.4, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);

        this.running = true;
        this.beginTime = Date.now();
    }
    /**
     * WebGL を利用して描画を行う。
     */
    render(){
        let gl = this.gl;
        if(this.running === true){
            requestAnimationFrame(this.render);
        }

        // 経過時間を取得
        this.nowTime = (Date.now() - this.beginTime) / 1000;
        // ウィンドウサイズぴったりに canvas のサイズを修正する
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // 色だけでなく深度もクリアされるようにする
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // どのプログラムオブジェクトを使うのかを明示する
        gl.useProgram(this.program);
        this.setAttribute(this.vbo, this.attLocation, this.attStride);

        // カメラ関連のパラメータを決める
        let cameraPosition    = [0.0, 0.0, 3.0];             // カメラの座標
        let centerPoint       = [0.0, 0.0, 0.0];             // カメラの注視点
        let cameraUpDirection = [0.0, 1.0, 0.0];             // カメラの上方向
        let fovy   = 60 * this.camera.scale;                 // カメラの視野角
        let aspect = this.canvas.width / this.canvas.height; // カメラのアスペクト比
        let near   = 0.1;                                    // 最近距離クリップ面
        let far    = 10.0;                                   // 最遠距離クリップ面
        this.vMatrix  = MAT.lookAt(cameraPosition, centerPoint, cameraUpDirection);
        this.pMatrix  = MAT.perspective(fovy, aspect, near, far);
        this.vpMatrix = MAT.multiply(this.pMatrix, this.vMatrix);
        // カメラのパラメータ類を更新し行列に効果を与える
        this.camera.update();
        let quaternionMatrix = MAT.identity(MAT.create());
        quaternionMatrix = QTN.toMatIV(this.camera.qtn, quaternionMatrix);
        this.vpMatrix = MAT.multiply(this.vpMatrix, quaternionMatrix);
        // モデル座標変換
        this.mMatrix = MAT.identity(this.mMatrix);
        this.mvpMatrix = MAT.multiply(this.vpMatrix, this.mMatrix);

        this.setUniform([
            this.mvpMatrix,
            this.nowTime,
        ], this.uniLocation, this.uniType);

        // レンダリングする
        gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
    }

    // utility method =========================================================

    /**
     * シェーダのソースコードを外部ファイルから取得する。
     * @param {Array.<string>} pathArray - シェーダを記述したファイルのパス（の配列）
     * @return {Promise}
     */
    loadShader(pathArray){
        if(Array.isArray(pathArray) !== true){
            throw new Error('invalid argument');
        }
        let promises = pathArray.map((path) => {
            return fetch(path).then((response) => {return response.text();})
        });
        return Promise.all(promises);
    }

    /**
     * シェーダオブジェクトを生成して返す。
     * コンパイルに失敗した場合は理由をアラートし null を返す。
     * @param {string} source - シェーダのソースコード文字列
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @return {WebGLShader} シェーダオブジェクト
     */
    createShader(source, type){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
    }

    /**
     * プログラムオブジェクトを生成して返す。
     * シェーダのリンクに失敗した場合は理由をアラートし null を返す。
     * @param {WebGLShader} vs - 頂点シェーダオブジェクト
     * @param {WebGLShader} fs - フラグメントシェーダオブジェクト
     * @return {WebGLProgram} プログラムオブジェクト
     */
    createProgram(vs, fs){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
            return null;
        }
    }

    /**
     * VBO を生成して返す。
     * @param {Array} data - 頂点属性データを格納した配列
     * @return {WebGLBuffer} VBO
     */
    createVbo(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    /**
     * IBO を生成して返す。
     * @param {Array} data - インデックスデータを格納した配列
     * @return {WebGLBuffer} IBO
     */
    createIbo(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    /**
     * IBO を生成して返す。(INT 拡張版)
     * @param {Array} data - インデックスデータを格納した配列
     * @return {WebGLBuffer} IBO
     */
    createIboInt(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        if(ext == null || ext.elementIndexUint == null){
            throw new Error('element index Uint not supported');
        }
        let ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    /**
     * 画像ファイルを読み込み、テクスチャを生成してコールバックで返却する。
     * @param {string} source - ソースとなる画像のパス
     * @return {Promise}
     */
    createTextureFromFile(source){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        return new Promise((resolve) => {
            let gl = this.gl;
            let img = new Image();
            img.addEventListener('load', () => {
                let tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, null);
                resolve(tex);
            }, false);
            img.src = source;
        });
    }

    /**
     * フレームバッファを生成して返す。
     * @param {number} width - フレームバッファの幅
     * @param {number} height - フレームバッファの高さ
     * @return {object} 生成した各種オブジェクトはラップして返却する
     * @property {WebGLFramebuffer} framebuffer - フレームバッファ
     * @property {WebGLRenderbuffer} renderbuffer - 深度バッファとして設定したレンダーバッファ
     * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
     */
    createFramebuffer(width, height){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        let depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {framebuffer: frameBuffer, renderbuffer: depthRenderBuffer, texture: fTexture};
    }

    /**
     * フレームバッファを生成して返す。（フロートテクスチャ版）
     * @param {object} ext - getWebGLExtensions の戻り値
     * @param {number} width - フレームバッファの幅
     * @param {number} height - フレームバッファの高さ
     * @return {object} 生成した各種オブジェクトはラップして返却する
     * @property {WebGLFramebuffer} framebuffer - フレームバッファ
     * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
     */
    createFramebufferFloat(ext, width, height){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        if(ext == null || (ext.textureFloat == null && ext.textureHalfFloat == null)){
            throw new Error('float texture not supported');
        }
        let flg = (ext.textureFloat != null) ? gl.FLOAT : ext.textureHalfFloat.HALF_FLOAT_OES;
        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, flg, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {framebuffer: frameBuffer, texture: fTexture};
    }

    /**
     * VBO を IBO をバインドし有効化する。
     * @param {Array} vbo - VBO を格納した配列
     * @param {Array} attL - attribute location を格納した配列
     * @param {Array} attS - attribute stride を格納した配列
     * @param {WebGLBuffer} ibo - IBO
     */
    setAttribute(vbo, attL, attS, ibo){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        vbo.forEach((v, index) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.enableVertexAttribArray(attL[index]);
            gl.vertexAttribPointer(attL[index], attS[index], gl.FLOAT, false, 0, 0);
        });
        if(ibo != null){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        }
    }

    /**
     * uniform 変数をまとめてシェーダに送る。
     * @param {Array} value - 各変数の値
     * @param {Array} uniL - uniform location を格納した配列
     * @param {Array} uniT - uniform 変数のタイプを格納した配列
     */
    setUniform(value, uniL, uniT){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        value.forEach((v, index) => {
            let type = uniT[index];
            if(type.includes('Matrix') === true){
                gl[type](uniL[index], false, v);
            }else{
                gl[type](uniL[index], v);
            }
        });
    }

    /**
     * 主要な WebGL の拡張機能を取得する。
     * @return {object} 取得した拡張機能
     * @property {object} elementIndexUint - Uint32 フォーマットを利用できるようにする
     * @property {object} textureFloat - フロートテクスチャを利用できるようにする
     * @property {object} textureHalfFloat - ハーフフロートテクスチャを利用できるようにする
     */
    getWebGLExtensions(){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        return {
            elementIndexUint: gl.getExtension('OES_element_index_uint'),
            textureFloat:     gl.getExtension('OES_texture_float'),
            textureHalfFloat: gl.getExtension('OES_texture_half_float')
        };
    }
}

/**
 * マウスでドラッグ操作を行うための簡易な実装例
 * @class
 */
class InteractionCamera {
    /**
     * @constructor
     */
    constructor(){
        this.qtn               = QTN.identity(QTN.create());
        this.dragging          = false;
        this.prevMouse         = [0, 0];
        this.rotationScale     = Math.min(window.innerWidth, window.innerHeight);
        this.rotation          = 0.0;
        this.rotateAxis        = [0.0, 0.0, 0.0];
        this.rotatePower       = 2.0;
        this.rotateAttenuation = 0.9;
        this.scale             = 1.0;
        this.scalePower        = 0.0;
        this.scaleAttenuation  = 0.8;
        this.scaleMin          = 0.25;
        this.scaleMax          = 2.0;
        this.startEvent        = this.startEvent.bind(this);
        this.moveEvent         = this.moveEvent.bind(this);
        this.endEvent          = this.endEvent.bind(this);
        this.wheelEvent        = this.wheelEvent.bind(this);
    }
    /**
     * mouse down event
     * @param {Event} eve - event object
     */
    startEvent(eve){
        this.dragging = true;
        this.prevMouse = [eve.clientX, eve.clientY];
    }
    /**
     * mouse move event
     * @param {Event} eve - event object
     */
    moveEvent(eve){
        if(this.dragging !== true){return;}
        let x = this.prevMouse[0] - eve.clientX;
        let y = this.prevMouse[1] - eve.clientY;
        this.rotation = Math.sqrt(x * x + y * y) / this.rotationScale * this.rotatePower;
        this.rotateAxis[0] = y;
        this.rotateAxis[1] = x;
        this.prevMouse = [eve.clientX, eve.clientY];
    }
    /**
     * mouse up event
     */
    endEvent(){
        this.dragging = false;
    }
    /**
     * wheel event
     * @param {Event} eve - event object
     */
    wheelEvent(eve){
        let w = eve.wheelDelta;
        let s = this.scaleMin * 0.1;
        if(w > 0){
            this.scalePower = -s;
        }else if(w < 0){
            this.scalePower = s;
        }
    }
    /**
     * quaternion update
     */
    update(){
        this.scalePower *= this.scaleAttenuation;
        this.scale = Math.max(this.scaleMin, Math.min(this.scaleMax, this.scale + this.scalePower));
        if(this.rotation === 0.0){return;}
        this.rotation *= this.rotateAttenuation;
        let q = QTN.identity(QTN.create());
        QTN.rotate(this.rotation, this.rotateAxis, q);
        QTN.multiply(this.qtn, q, this.qtn);
    }
}

