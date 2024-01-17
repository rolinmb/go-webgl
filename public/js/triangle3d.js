function startWebgl() {
    console.log("Attempting to start WebGL");
    var CANVAS = document.getElementById("webgl-target");
    CANVAS.width = 1080;
    CANVAS.height = 720;
    var GL;
    try {
      GL = CANVAS.getContext("webgl", {antialias: true});
    } catch (e) {
      alert("WebGL context cannot be initialized");
      return false;
    }
    console.log("WebGL has been successfully initialized");
    const shaderVertexSrc = 'attribute vec3 position;\n\
  uniform mat4 Pmatrix, Vmatrix, Mmatrix;\n\
  attribute vec3 color;\n\
  varying vec3 vColor;\n\
  void main(void){\n\
  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
  vColor = color;}';
    const shaderFragmentSrc = 'precision mediump float;\n\
  varying vec3 vColor;\n\
  void main(void){\n\
  gl_FragColor = vec4(vColor, 1.);}';
    var compileShader = function(source, type, typeString) {
      var shader = GL.createShader(type);
      GL.shaderSource(shader, source);
      GL.compileShader(shader);
      if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        alert("ERROR IN "+typeString+" SHADER: "+GL.getShaderInfoLog(shader));
        return false;
      }
      return shader;
    };
    console.log("Compiling WebGL shaders");
    var shaderVertex = compileShader(shaderVertexSrc, GL.VERTEX_SHADER, "VERTEX");
    console.log("Successfully compiled WebGL Vertex Shader");
    var shaderFragment = compileShader(shaderFragmentSrc, GL.FRAGMENT_SHADER, "FRAGMENT");
    console.log("Successfully compiled WebGL Fragment Shader");
    var shaderProgram = GL.createProgram();
    GL.attachShader(shaderProgram, shaderVertex);
    GL.attachShader(shaderProgram, shaderFragment);
    GL.linkProgram(shaderProgram);
    var _Pmatrix = GL.getUniformLocation(shaderProgram, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(shaderProgram, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(shaderProgram, "Mmatrix");
    var _color = GL.getAttribLocation(shaderProgram, "color");
    var _position = GL.getAttribLocation(shaderProgram, "position");
    GL.enableVertexAttribArray(_color);
    GL.enableVertexAttribArray(_position);
    GL.useProgram(shaderProgram);
    console.log("Successfully linked program shaders and is ready to render to context/target");
    var triVertices = [ // 2D triangle projected into 3D: 3 vertices and 3 faces
      -1, -1, 0, 0, 0, 1, // (-1,-1,0)
       1, -1, 0, 1, 1, 0, // (1,-1,0)
       1,  1, 0, 1, 0, 0 // (1, 1, 0)
    ];
    var triVbo = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, triVbo);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triVertices), GL.STATIC_DRAW);
    console.log("Successfully bound triangle vertices to WebGL rendering buffer");
    var triFaces = [0, 1, 2];
    var triFbo = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, triFbo);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triFaces), GL.STATIC_DRAW);
    console.log("Successfully bound triangle faces to WebGL rendering buffer");
    var PROJMATRIX = UTILS.getProjection(40, CANVAS.width/CANVAS.height, 1, 100);
    var VIEWMATRIX = UTILS.getId4();
    var MOVEMATRIX = UTILS.getId4();
    UTILS.translateZ(VIEWMATRIX, -5);
    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearDepth(1.0);
    var tlast = 0;
    console.log('Starting WebGL render to <canvas id="webgl-target"> context');
    var animate = function(t) {
      let dt = (t-tlast);
      UTILS.rotateX(MOVEMATRIX, dt*0.0001);
      UTILS.rotateY(MOVEMATRIX, dt*0.001);
      UTILS.rotateZ(MOVEMATRIX, dt*0.0005);
      tlast = t;
      GL.viewport(0, 0, CANVAS.width, CANVAS.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
      GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
      GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
      GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
      GL.bindBuffer(GL.ARRAY_BUFFER, triVbo);
      GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4*(3+3), 0);
      GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4*(3+3), 3*4);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, triFbo);
      GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
      GL.flush();
      window.requestAnimationFrame(animate);
    }
    animate(0);
  }
  
  window.addEventListener("load", startWebgl);
  
