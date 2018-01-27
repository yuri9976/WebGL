window.onload = function(){
	// HTML上のCanvasへの参照を取得する
	var canvas = document.getElementById('canvas');

	// Canvasサイズを変更
	canvas.width = 512;
	canvas.height = 512;

	// CanvasエレメントからWebGLコンテキストを取得する
	var gl = canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl');

	// WebGLコンテキストが取得できたかどうか調べる
	if(!gl){
		alert('webgl not supported!');
		return;
	}

	// Canvasエレメントをクリアする色を指定する
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Canvasエレメントをクリアする
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// 三角形を形成する頂点のデータを受け取る
	var triangleData = genTriangle();

	// 頂点データからバッファを生成
	var vertexBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleData.p), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // 使用していたバッファの予約を解除

	// 色データからバッファを生成
	var colorBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleData.c), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // 使用していたバッファの予約を解除

	// シェーダとプログラムオブジェクト
	var vertexSource = document.getElementById('vs').textContent;
	var fragmentSource = document.getElementById('fs').textContent;

	// ユーザー定義のプログラムオブジェクト生成関数
	// この中でWebGLShaderオブジェクトとWebGLProgramオブジェクトを紐づけ
	var programs = shaderProgram(vertexSource, fragmentSource);

	var attLocation = new Array(2);
	// プログラムオブジェクト（VBO）に三角形の頂点データを登録
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	attLocation[0] = gl.getAttribLocation(programs, 'position'); // attributeLocationの取得
	gl.enableVertexAttribArray(attLocation[0]); // attribute属性を有効にする
	gl.vertexAttribPointer(attLocation[0], 3, gl.FLOAT, false, 0, 0); // attribute属性を登録
	
	// プログラムオブジェクト（VBO）に三角形の色データを登録
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	attLocation[1] = gl.getAttribLocation(programs, 'color');
	gl.enableVertexAttribArray(attLocation[1]);
	gl.vertexAttribPointer(attLocation[1], 4, gl.FLOAT, false, 0, 0 );

// 行列の初期化
	// matTVクラスをインスタンス化する
	var mat = new matIV();
// 行列を初期化
	// モデル座標変換行列
	var mMatrix = mat.identity(mat.create());
	// ビュー座標変換行列
	var vMatrix = mat.identity(mat.create());
	// プロジェクション座標変換行列
	var pMatrix = mat.identity(mat.create());
	// p×v
	var vpMatrix = mat.identity(mat.create());
	// p×v×m
	var mvpMatrix = mat.identity(mat.create());
	
	// モデル座標変換行列
//	var move = [0.5, 0.5, 0.0];           // 移動量はXYそれぞれ0.5
	var move = [0.2, 0.5, 0.0];           // 移動量はXYそれぞれ0.5
	mat.translate(mMatrix, move, mMatrix);

	// ビュー座標変換行列
	var cameraPosition = [0.0, 0.0, 3.0]; // カメラの位置
	var centerPoint = [0.0, 0.0, 0.0];    // 注視点
	var cameraUp = [0.0, 1.0, 0.0];       // カメラの上方向
	mat.lookAt(cameraPosition, centerPoint, cameraUp, vMatrix);

	// プロジェクションのための情報を揃える
	var fovy = 45;                             // 視野角
	var aspect = canvas.width / canvas.height; // アスペクト比
	var near = 0.1;                            // 空間の最前面
	var far = 10.0;                            // 空間の奥行き終端
	mat.perspective(fovy, aspect, near, far, pMatrix);

	// 行列を掛け合わせてMVPマトリックスを生成
	mat.multiply(pMatrix, vMatrix, vpMatrix);   // pにvを掛ける
	mat.multiply(vpMatrix, mMatrix, mvpMatrix); // さらにmを掛ける

	// シェーダに行列を送信する
	var uniLocation = gl.getUniformLocation(programs, 'mvpMatrix');
	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

	// 描画
	gl.drawArrays(gl.TRIANGLES, 0, triangleData.p.length / 3);
//	console.log('triangleData.p.length = ',triangleData.p.length);
//	console.log('triangleData.c.length = ',triangleData.c.length);
	gl.flush();

	// プログラムオブジェクト生成関数
	function shaderProgram(vertexSource, fragmentSource){
		// シェーダオブジェクトの生成
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

		// シェーダにソースを割り当ててコンパイル
		gl.shaderSource(vertexShader, vertexSource);
		gl.compileShader(vertexShader);
		if(! gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
			alert(gl.getShaderInfoLog(vertexShader));
		}
		
		gl.shaderSource(fragmentShader, fragmentSource);
		gl.compileShader(fragmentShader);
		if(! gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
			alert(gl.getShaderInfoLog(fragmentShader));
		}

		// プログラムオブジェクトの生成から選択まで
		var programs = gl.createProgram();
		gl.attachShader(programs, vertexShader);
		gl.attachShader(programs, fragmentShader);
		gl.linkProgram(programs);
		if(gl.getProgramParameter(programs, gl.LINK_STATUS)){
			gl.useProgram(programs);
			// 生成したプログラムオブジェクトを戻り値として返す
			return programs;
		} else {
			alert(gl.getProgramInfoLog(programs));
		}
	}
};

function genTriangle(){
	var obj = {};
	// 頂点データ
	obj.p = [
		 // ひとつ目の三角形
		 0.0,  0.4, 0.1,
		 0.5, -0.5, 0.0,
		-0.5, -0.5, 0.0,
		
		 // ふたつ目の三角形
		 0.0, -0.5, 0.1,
		 0.5,  0.5, 0.0,
		-0.5,  0.5, 0.0
	];
	// 色データ
	obj.c = [
		 // ひとつ目の三角形
		 0.0, 1.0, 1.0, 1.0, // Cyan
		 1.0, 0.0, 1.0, 1.0, // Magenta
		 1.0, 1.0, 0.0, 1.0, // Yellow
		
		 // ふたつ目の三角形
		 1.0, 0.0, 0.0, 1.0, // Red
		 0.0, 0.0, 1.0, 1.0, // Blue
		 0.0, 1.0, 0.0, 1.0  // Green
	];
	return obj;
}

