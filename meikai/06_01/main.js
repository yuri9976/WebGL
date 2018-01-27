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

	// 球体を生成
	var sphereData = sphere(16, 16, 1.0);

	// VS用オブジェクトを生成
	var vertexBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.p), gl.STATIC_DRAW);

	// VSとFSを生成
	var vertexSource = document.getElementById('vs').textContent;
	var fragmentSource = document.getElementById('fs').textContent;

	// VSとFSをプログラムに紐づけ
	var programs = shaderProgram(vertexSource, fragmentSource);

	// VBO
	var attLocation = gl.getAttribLocation(programs, 'position');
	gl.enableVertexAttribArray(attLocation);
	gl.vertexAttribPointer(attLocation, 3, gl.FLOAT, false, 0, 0);

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

	// 
	mat.multiply(pMatrix, vMatrix, vpMatrix);   // 

	// 
	var count = 0;

	// 
	render();

	// 
	function render(){
		// 
		count++;

		// 
		var radians = (count % 360) * Math.PI / 180;

		// Canvas
		gl.clear(gl.COLOR_BUFFER_BIT);

		// 
		mat.identity(mMatrix);

		// 
		var axis = [0.0, 0.0, 1.0];
		mat.rotate(mMatrix, radians, axis, mMatrix);

		// 
		mat.multiply(vpMatrix, mMatrix, mvpMatrix);

		// 
		var uniLocation = gl.getUniformLocation(programs, 'mvpMatrix');
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

		// 
		gl.drawArrays(gl.TRIANGLES, 0, sphereData.p.length / 3);
		gl.flush();

		// 
		requestAnimationFrame(render);
	}

	// 
	function shaderProgram(vertexSource, fragmentSource){
		// 
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

		// 各シェーダからシェーダソースを作る（WebGLが解釈できる形にする）
		gl.shaderSource(vertexShader, vertexSource);
		gl.compileShader(vertexShader);
		gl.shaderSource(fragmentShader, fragmentSource);
		gl.compileShader(fragmentShader);

		// シェーダソースをリンクしてプログラムを作成する
		var programs = gl.createProgram();
		gl.attachShader(programs, vertexShader);
		gl.attachShader(programs, fragmentShader);
		gl.linkProgram(programs);
		gl.useProgram(programs);

		// 
		return programs;
	}
};


