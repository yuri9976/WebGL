// https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample2/webgl-demo.js

main();

//
// ここから始める（index.htmlの<body>内でこのスクリプトを指定しているので、上記main()が実行される
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');

  // GLコンテキストが無い場合は警告を表示して終了

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // バーテックスシェーダプログラム

  const vsSource = `					// 謎のバッククオート
    attribute vec4 aVertexPosition;		// 頂点座標をvec4型変数に格納するつもり
    uniform mat4 uModelViewMatrix;		// ビュー座標変換用行列
    uniform mat4 uProjectionMatrix;		// プロジェクション座標変換用行列
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // フラグメントシェーダプログラム

  const fsSource = `	// ここでも謎のバッククオート
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // シェーダプログラムを初期化する；各頂点やその他もろもろに対する
  // ライティングが決まる。
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // シェーダプログラムに必要な全ての情報を集める。
  // シェーダプログラムのどのアトリビュートがaVertexPositionを参照したり
  // ロケーションを参照しているのか
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // 描画しようとしているすべてのオブジェクトをビルドするルーチンを
  // ここでコールする。
  const buffers = initBuffers(gl);

  // シーンの描画
  drawScene(gl, programInfo, buffers);
}

//
// バッファ初期化
//
// 必要となるバッファを全て初期化する。このデモでは、
// 一つのオブジェクト（２次元の正方形）のみ
//
function initBuffers(gl) {

  // 正方形の位置を格納するためのバッファを生成する

  const positionBuffer = gl.createBuffer();

  // positionBufferを処理の出力結果用に選択する

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 正方形の位置用の配列を生成する（逆Z型。。）

  const positions = [
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
  ];

  // 形状を構築するために位置のリストをWebGLに渡す。
  // JavaScript配列からFloat32Arrayを生成し、カレントバッファを
  // 埋めるために用いる。

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

//
// シーンを描画する
//
function drawScene(gl, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // クリアカラーを黒色、不透明に設定
  gl.clearDepth(1.0);                 // 深度バッファを設定
  gl.enable(gl.DEPTH_TEST);           // 深度テストを有効化
  gl.depthFunc(gl.LEQUAL);            // 近くにある物体は、遠くにある物体を覆い隠す

  // 描画前にキャンバス（カラーバッファや深度バッファ）をクリア

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // パースペクティブ行列という特殊な行列を作成し、カメラ内の
  // パースペクティブの歪みをシミュレートする。
  // 我々の視野は45°、幅/高さ比はキャンバスの表示サイズに対応し、
  // カメラから0.1～100ユニットだけ離れているオブジェクトのみを
  // 表示させようとしている。

  const fieldOfView = 45 * Math.PI / 180;   // ラジアン表記
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // 注: glmatrix.js は常に最初の引数を、結果の受け取り先として用いる。
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // 描画位置を「アイデンティティ」ポイントに設定する。
  // これはシーンの中央を表す。
  const modelViewMatrix = mat4.create();

  // 四角の描画を開始するために描画位置を移動させる。

  mat4.translate(modelViewMatrix,     // 結果格納用行列
                 modelViewMatrix,     // 変換用行列
                 [-0.0, 0.0, -6.0]);  // 移動量

  // WebGLに位置バッファから頂点位置属性をどのように引き出すかを教える。
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // 描画時にWebGLに用いるプログラムを伝える。

  gl.useProgram(programInfo.program);

  // シェーダユニフォームをセットする。

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const offset = 0;
    const vertexCount = 4;
    // GPUでシェーダが起動する
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

//
// シェーダプログラムを初期化し、WebGLが描画方法を知る
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // シェーダプログラムを生成／アタッチ／リンクする。

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // シェーダプログラムの生成が失敗したら警告を出す。

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// 与えられたタイプのシェーダを生成し、ソースをアップロードし、コンパイルする。
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // ソースをシェーダオブジェクトに送る。

  gl.shaderSource(shader, source);

  // シェーダプログラムをコンパイルする。

  gl.compileShader(shader);

  // コンパイルがうまくいったかどうか

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
