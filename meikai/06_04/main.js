window.onload = function(){
	// HTMLからCanvas要素を取得
	var c = document.getElementById('canvas');

	// Canvasのサイズを指定
	c.width = 512;
	c.height = 512;

	// CanvasエレメントからWebGLを取得
	var gl = c.getContext('webgl');

	// WebGLが取得できなかったら警告
	if(!gl){
		alert('webgl not supported!');
		return;
	}

	// Canvasをクリア
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);

	// VSとFSを生成
	var vertexSource = document.getElementById('vs').textContent;
	var fragmentSource = document.getElementById('fs').textContent;

	// VSとFSをプログラムに紐づけ
	var programs = shaderProgram(vertexSource, fragmentSource);

	// 球体を生成
	var sphereData = sphere(16, 16, 1.0);

	// 頂点データから頂点座標位置のVBOを生成
	var vPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.p), gl.STATIC_DRAW);
	// VBO（プログラムオブジェクトに頂点データを登録）
	var attLocPosition = gl.getAttribLocation(programs, 'position');
	gl.enableVertexAttribArray(attLocPosition);
	gl.vertexAttribPointer(attLocPosition, 3, gl.FLOAT, false, 0, 0);

	// 頂点データから頂点色のVBOを生成
	var vColorBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ARRAY_BUFFER, vColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.c), gl.STATIC_DRAW);
	var attLocColor = gl.getAttribLocation(programs, 'color');
	gl.enableVertexAttribArray(attLocColor);
	gl.vertexAttribPointer(attLocColor, 4, gl.FLOAT, false, 0, 0);
	
	// インデックスバッファの生成
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(sphereData.i), gl.STATIC_DRAW);

	// 行列
	var mat = new matIV();
	var mMatrix = mat.identity(mat.create());
	var vMatrix = mat.identity(mat.create());
	var pMatrix = mat.identity(mat.create());
	var vpMatrix = mat.identity(mat.create());
	var mvpMatrix = mat.identity(mat.create());
	
	// カメラ設定
	var cameraPosition = [0.0, 0.0, 3.0]; // z方向にオフセット
	var centerPoint = [0.0, 0.0, 0.0];    // 原点はゼロ
	var cameraUp = [0.0, 1.0, 0.0];       // y方向
	mat.lookAt(cameraPosition, centerPoint, cameraUp, vMatrix);

	// 
	var fovy = 45;                             // 
	var aspect = canvas.width / canvas.height; // 
	var near = 0.1;                            // 
	var far = 10.0;                            // 
	mat.perspective(fovy, aspect, near, far, pMatrix);

	// 行列掛け算
	mat.multiply(pMatrix, vMatrix, vpMatrix);

	var count = 0;
	// 【New】深度テストを有効化
	gl.enable(gl.DEPTH_TEST);
	// 【New】深度テストの方法を指定
	gl.depthFunc(gl.LEQUAL);

	render();

	function render(){

		count++;

		var radians = (count % 360) * Math.PI / 180;

		// Canvas
		gl.clear(gl.COLOR_BUFFER_BIT);

		mat.identity(mMatrix);

		var axis = [0.0, 1.0, 1.0];
		mat.rotate(mMatrix, radians, axis, mMatrix);

		mat.multiply(vpMatrix, mMatrix, mvpMatrix);

		// uniform変数のロケーションを取得する
		var uniLocation = gl.getUniformLocation(programs, 'mvpMatrix');
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

		// ライトの位置を指定する
		var lightPosition = [1.0, 1.0, 1.0];
		
		// uniformロケーション情報を取得
		var uniLocation = gl.getUniformLocation(programs, 'lightPosition');
		// シェーダにライトの位置を送信
		gl.uniform3fv(uniLocation, lightPosition);
		
		//  インデックスバッファを用いるのでdrawArrayではなくdrawElements
		gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);
		gl.flush();

		// 次の再描画の前にアニメーションを更新
		requestAnimationFrame(render);
	}

	// 
	function shaderProgram(vertexSource, fragmentSource){
		// シェーダを作成
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

		// 各シェーダからシェーダソースを作る（WebGLが解釈できる形にする）
		gl.shaderSource(vertexShader, vertexSource);
		gl.compileShader(vertexShader);
		if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
			alert(gl.getShaderInfoLog(vertexShader));
			return null;
		}

		gl.shaderSource(fragmentShader, fragmentSource);
		gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
			alert(gl.getShaderInfoLog(fragmentShader));
			return null;
		}

		// シェーダソースをリンクしてプログラムを作成する
		var programs = gl.createProgram();
		gl.attachShader(programs, vertexShader);
		gl.attachShader(programs, fragmentShader);
		gl.linkProgram(programs);
		gl.useProgram(programs);

		// VSとFSを紐づけたプログラムを返す
		return programs;
	}
};


