window.onload = function(){
	// HTML上のCanvasへの参照を取得する
	var c = document.getElementById('canvas');

	// Canvasサイズを変更
	c.width = 512;
	c.height = 512;

	// CanvasエレメントからWebGLコンテキストを取得する
	var gl = c.getContext('webgl');

	// WebGLコンテキストが取得できたかどうか調べる
	if(!gl){
		alert('webgl not supported!');
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

	// ユーザー定義のプログラムオブジェクト生成関数
	var programs = shaderProgram(vertexSource, fragmentSource);

	// プログラムオブジェクトに三角形の頂点データを登録
	var attLocation = gl.getAttribLocation(programs, 'position');
	gl.enableVertexAttribArray(attLocation);
	gl.vertexAttribPointer(attLocation, 3, gl.FLOAT, false, 0, 0);

	// 描画
	gl.drawArrays(gl.TRIANGLES, 0, triangleData.p.length / 3);
	gl.flush();

	// プログラムオブジェクト生成関数
	function shaderProgram(vertexSource, fragmentSource){
		// シェーダオブジェクトの生成
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

		// シェーダにソースを割り当ててコンパイル
		gl.shaderSource(vertexShader, vertexSource);
		gl.compileShader(vertexShader);
		gl.shaderSource(fragmentShader, fragmentSource);
		gl.compileShader(fragmentShader);

		// プログラムオブジェクトの生成から選択まで
		var programs = gl.createProgram();
		gl.attachShader(programs, vertexShader);
		gl.attachShader(programs, fragmentShader);
		gl.linkProgram(programs);
		gl.useProgram(programs);

		// 生成したプログラムオブジェクトを戻り値として返す
		return programs;
	}
};

function genTriangle(){
	var obj = {};
	obj.p = [
		 // ひとつ目の三角形
		 0.0,  0.5, 0.0,
		 0.5, -0.5, 0.0,
		-0.5, -0.5, 0.0,
		
		 // ふたつ目の三角形
		 0.0, -0.5, 0.0,
		 0.5,  0.5, 0.0,
		-0.5,  0.5, 0.0
	];
	return obj;
}

