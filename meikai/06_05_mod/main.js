window.onload = function(){
	// HTMLからCanvas要素を取得
	var c = document.getElementById('canvas');

	// CanvasエレメントからWebGLを取得
	var gl = c.getContext('webgl');

	// WebGLが取得できなかったら警告
	if(!gl){
		alert('webgl not supported!');
		return;
	}

	// canvas のマウスムーブイベントに処理を登録
	c.addEventListener('click', mouseMove, true);

	// Canvasをクリア
	gl.clearColor(0.5, 0.5, 0.5, 1.0);
	gl.clearDepth(1.0);

	// VSとFSを生成
	var vertexSource = document.getElementById('vs').textContent;
	var fragmentSource = document.getElementById('fs').textContent;

	// VSとFSをプログラムに紐づけ
	var programs = shaderProgram(vertexSource, fragmentSource);

	// ライトベクトル
	var lightDirection = [1.0, 1.0, 1.0];
	
	// uniformロケーション情報を取得する
	var uniLocation = {};
	uniLocation.mvpMatrix = gl.getUniformLocation(programs, 'mvpMatrix');
	uniLocation.invMatrix = gl.getUniformLocation(programs, 'invMatrix');
	uniLocation.lightDirection = gl.getUniformLocation(programs, 'lightDirection');

	// 行列
	var mat = new matIV();
	var mMatrix = mat.identity(mat.create());
	var vMatrix = mat.identity(mat.create());
	var pMatrix = mat.identity(mat.create());
	var vpMatrix = mat.identity(mat.create());
	var mvpMatrix = mat.identity(mat.create());
	// 逆行列
	var invMatrix = mat.identity(mat.create());

	// カメラ設定
	var cameraPosition = [0.0, 0.0, 5.0]; // z方向にオフセット
	var centerPoint = [0.0, 0.0, 0.0];    // 原点はゼロ
	var cameraUp = [0.0, 1.0, 0.0];       // y方向
	mat.lookAt(cameraPosition, centerPoint, cameraUp, vMatrix);

	// 
	var fovy = 80;                             // 
	var aspect = canvas.width / canvas.height; // 
	var near = 0.1;                            // 
	var far = 10.0;                            // 
	mat.perspective(fovy, aspect, near, far, pMatrix);

	// 行列掛け算
	mat.multiply(pMatrix, vMatrix, vpMatrix);

	var count = 0;
	// 深度テストを有効化
	gl.enable(gl.DEPTH_TEST);
	// 深度テストの方法を指定
	gl.depthFunc(gl.LEQUAL);

	// 球体を生成（楕円体にしている）
	var sphereData = sphere(32, 32, 1.0);
	
	var coneData1 = cone(1,-1);
	var coneData2 = cone(-1,-1);

	render();

	function render(){
		count++;
		var radians = (count % 180) * Math.PI / 360;

		// Canvasをクリアする（クリア対象：カラーバッファのみ）
		//gl.clear(gl.COLOR_BUFFER_BIT);
		// Canvasをクリアする（クリア対象：カラーバッファ＆深度バッファ）
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat.identity(mMatrix);

		var axis = [0.0, 1.0, 0.0];
//		mat.rotate(mMatrix, radians, axis, mMatrix);

		mat.multiply(vpMatrix, mMatrix, mvpMatrix);
		mat.inverse(mMatrix, invMatrix);

		// 体頂点データから頂点座標位置のVBOを生成
		var vPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.p), gl.STATIC_DRAW);
		// VBO（プログラムオブジェクトに体頂点データを登録）
		var attLocPosition = gl.getAttribLocation(programs, 'position');
		gl.enableVertexAttribArray(attLocPosition);
		gl.vertexAttribPointer(attLocPosition, 3, gl.FLOAT, false, 0, 0);

		// コンパイルは通るけどsphereがでなくなる('・ω・`）
//		var vPositionBuffer = makeVertexVBO(sphereData.p);
//		var attLocPosition = registerVBO();

		// 体頂点データから法線VBOを生成して登録
		var vNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.n), gl.STATIC_DRAW);
		var attLocNormal = gl.getAttribLocation(programs, 'normal');
		gl.enableVertexAttribArray(attLocNormal);
		gl.vertexAttribPointer(attLocNormal, 3, gl.FLOAT, false, 0, 0);

		// 体頂点データから頂点色のVBOを生成
		var vColorBuffer = gl.createBuffer(); 
		gl.bindBuffer(gl.ARRAY_BUFFER, vColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.c), gl.STATIC_DRAW);
		var attLocColor = gl.getAttribLocation(programs, 'color');
		gl.enableVertexAttribArray(attLocColor);
		gl.vertexAttribPointer(attLocColor, 4, gl.FLOAT, false, 0, 0);
	
		// 体頂点インデックスバッファの生成
		var indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(sphereData.i), gl.STATIC_DRAW);

//		Texture texture = context.createTexture();
//		context.bindTexture(TEXTURE_2D, texture);


		// シェーダにuniformデータを送る
		gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation.invMatrix, false, invMatrix);
		gl.uniform3fv(uniLocation.lightDirection, lightDirection);

		//  インデックスバッファを用いるのでdrawArrayではなくdrawElements
		gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);

		// 足１頂点データから頂点座標位置のVBOを生成
		var vPositionBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneData1.vertices), gl.STATIC_DRAW);
		// VBO（プログラムオブジェクトに足１頂点データを登録）
		var attLocPosition2 = gl.getAttribLocation(programs, 'position');
		gl.enableVertexAttribArray(attLocPosition2);
		gl.vertexAttribPointer(attLocPosition2, 3, gl.FLOAT, false, 0, 0);

		// 足１頂点データから法線VBOを生成して登録
		var vNormalBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneData1.normals), gl.STATIC_DRAW);
		var attLocNormal2 = gl.getAttribLocation(programs, 'normal');
		gl.enableVertexAttribArray(attLocNormal2);
		gl.vertexAttribPointer(attLocNormal2, 3, gl.FLOAT, false, 0, 0);

		// 体頂点データから足１頂点色のVBOを生成
		var vColorBuffer2 = gl.createBuffer(); 
		gl.bindBuffer(gl.ARRAY_BUFFER, vColorBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.c), gl.STATIC_DRAW);
		var attLocColor2 = gl.getAttribLocation(programs, 'color');
		gl.enableVertexAttribArray(attLocColor2);
		gl.vertexAttribPointer(attLocColor2, 4, gl.FLOAT, false, 0, 0);
		
		// 足１頂点インデックスバッファの生成
		var indexBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer2);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(coneData1.indices), gl.STATIC_DRAW);

		// シェーダにuniformデータを送る
		gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation.invMatrix, false, invMatrix);
		gl.uniform3fv(uniLocation.lightDirection, lightDirection);

		gl.drawElements(gl.TRIANGLES, coneData1.indices.length, gl.UNSIGNED_SHORT, 0);

		// 足２頂点データから頂点座標位置のVBOを生成
		var vPositionBuffer3 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuffer3);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneData2.vertices), gl.STATIC_DRAW);
		// VBO（プログラムオブジェクトに足２頂点データを登録）
		var attLocPosition2 = gl.getAttribLocation(programs, 'position');
		gl.enableVertexAttribArray(attLocPosition2);
		gl.vertexAttribPointer(attLocPosition2, 3, gl.FLOAT, false, 0, 0);

		// 足２頂点データから法線VBOを生成して登録
		var vNormalBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneData2.normals), gl.STATIC_DRAW);
		var attLocNormal2 = gl.getAttribLocation(programs, 'normal');
		gl.enableVertexAttribArray(attLocNormal2);
		gl.vertexAttribPointer(attLocNormal2, 3, gl.FLOAT, false, 0, 0);

		// 体頂点データから足２頂点色のVBOを生成
		var vColorBuffer2 = gl.createBuffer(); 
		gl.bindBuffer(gl.ARRAY_BUFFER, vColorBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.c), gl.STATIC_DRAW);
		var attLocColor2 = gl.getAttribLocation(programs, 'color');
		gl.enableVertexAttribArray(attLocColor2);
		gl.vertexAttribPointer(attLocColor2, 4, gl.FLOAT, false, 0, 0);
		
		// 足２頂点インデックスバッファの生成
		var indexBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer2);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(coneData2.indices), gl.STATIC_DRAW);

		mat.lookAt(cameraPosition, centerPoint, cameraUp, vMatrix);

		// シェーダにuniformデータを送る
		gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation.invMatrix, false, invMatrix);
		gl.uniform3fv(uniLocation.lightDirection, lightDirection);

		gl.drawElements(gl.TRIANGLES, coneData2.indices.length, gl.UNSIGNED_SHORT, 0);


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

	// 繰り返し処理をまとめてみるテスト
	function makeVertexVBO(indecies){
		var vPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indecies.p), gl.STATIC_DRAW);
		return vPositionBuffer;
	}
	// 繰り返し処理をまとめてみるテスト
	function registerVBO(){
		var attLocPosition = gl.getAttribLocation(programs, 'position');
		gl.enableVertexAttribArray(attLocPosition);
		gl.vertexAttribPointer(attLocPosition, 3, gl.FLOAT, false, 0, 0);
		return attLocPosition;
	}

	function mouseMove(e) {
		var c = document.getElementById('canvas');
		var x = (e.offsetX / c.width - 0.5) * 4.0;
		var y = - (e.offsetY / c.height - 0.5) * 4.0;
		cameraPosition = [x, y, 1.0];
		mat.lookAt(cameraPosition, centerPoint, cameraUp, vMatrix);
		mat.multiply(pMatrix, vMatrix, vpMatrix);
		console.log("x = %d, y = %d", x, y);
	}

};


