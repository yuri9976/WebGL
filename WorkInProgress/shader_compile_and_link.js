window.onload = function(){
	// HTML上のCanvasへの参照を取得する
	var c = document.getElementById('canvas');

	// Canvasサイズを変更
	c.width = 512;
	c.height = 512;

	// CanvasエレメントからWebGLコンテキストを取得する
	var gl = c.getContext('webgl') ||
			c.getContext('experimental-webgl');

	// WebGLコンテキストが取得できたかどうか調べる
	if(!gl){
		alert('webgL not supported!');
		return;
	}

	// Canvasエレメントをクリアする色を指定する
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Canvasエレメントをクリアする
	gl.clear(gl.COLOR_BUFFER_BIT);

	// 三角形を形成する頂点のデータを受け取る
	var triangleData = genTriangle();

	// 頂点データからバッファを生成
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleData.p), gl.STATIC_DRAW);

	// シェーダとプログラムオブジェクト
	var vertexSource = document.getElementById('vs').textContent;
	var fragmentSource = document.getElementById('fs').textContent;

	// シェーダオブジェクトの生成
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	// シェーダにソースコードを割り当てる
	gl.shaderSource(vertexShader, vertexSource);
	// シェーダのコンパイル
	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		alert(gl.getShaderInfoLog(vertexShader));
		return null;
	}

	// シェーダオブジェクトの生成
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	// シェーダにソースコードを割り当てる
	gl.shaderSource(fragmentShader, fragmentSource);
	// シェーダのコンパイル
	gl.compileShader(fragmentShader);
	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
		alert(gl.getShaderInfoLog(fragmentShader));
		return null;
	}

	// プログラムオブジェクトの作成
	var programs = gl.createProgram();
	// シェーダのアタッチ
	gl.attachShader(programs, vertexShader);
	gl.attachShader(programs, fragmentShader);

	// 頂点シェーダとフラグメントシェーダをリンク
	gl.linkProgram(programs);

	// プログラムオブジェクトを選択状態にする
	gl.useProgram(programs);

	// プログラムオブジェクトに三角形の頂点データを登録
	var attLocation = gl.getAttribLocation(programs, 'position');
	gl.enableVertexAttribArray(attLocation);
	gl.vertexAttribPointer(attLocation, 3, gl.FLOAT, false, 0, 0);

	// 描画
	gl.drawArrays(gl.TRIANGLES, 0, triangleData.p.length / 3);
	gl.flush();
};

function genTriangle(){
	var obj = {};
	obj.p = [
		// 1つめの三角形
		 0.0,  0.5, 0.0,
		 0.5, -0.5, 0.0,
		-0.5, -0.5, 0.0,
		// 2つめの三角形
		 0.0, -0.5, 0.0,
		 0.5,  0.5, 0.0,
		-0.5,  0.5, 0.0
	];
	return obj;
}
