function startWebgl() {
  console.log("Attempting to start WebGL");
  var CANVAS = document.getElementById("webgl-target");
  CANVAS.width = 1080;
  CANVAS.height = 720;
  var drag = false;
  var xprev,yprev;
  var mouseDn = function(e) {
    drag = true;
    xprev = e.pageX;
    yprev = e.pageY;
    e.preventDefault();
    return false;
  }
  var mouseUp = function(e) {
    drag = false;
  }
  var mouseMv = function(e) {
    if (!drag) {return false;}
    let dx = e.pageX-xprev;
    let dy = e.pageY-yprev;
    THETA += dx*2*Math.PI/CANVAS.width;
    PHI += dy*2*Math.PI/CANVAS.height;
    xprev = e.pageX;
    yprev = e.pageY;
    e.preventDefault();
  }
  CANVAS.addEventListener("mousedown", mouseDn, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMv, false);
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
  var cubeVertices = [ // 3D cube with a 3D projection: 8 vertices (top and bottom faces) and 6 faces
    -1, -1, -1, 0, 0, 0, // blend color faces
    1, -1, -1, 1, 0, 0,
    1, 1, -1, 1, 1, 0,
    -1, 1, -1, 0, 1, 0,
    -1, -1, 1, 0, 0, 1,
    1, -1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1,
    -1, 1, 1, 0, 1, 1
  ];
  var cubeVbo = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, cubeVbo);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cubeVertices), GL.STATIC_DRAW);
  console.log("Successfully bound cube vertices to WebGL rendering buffer");
  var cubeFaces = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    0, 3, 7, 0, 4, 7,
    1, 2, 6, 1, 5, 6,
    2, 3, 6, 3, 7, 6,
    0, 1, 5, 0, 4, 5
  ];
  var cubeFbo = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cubeFbo);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeFaces), GL.STATIC_DRAW);
  console.log("Successfully bound cube faces to WebGL rendering buffer");
  var PROJMATRIX = UTILS.getProjection(40, CANVAS.width/CANVAS.height, 1, 100);
  var VIEWMATRIX = UTILS.getId4();
  var MOVEMATRIX = UTILS.getId4();
  UTILS.translateZ(VIEWMATRIX, -5);
  var THETA = 0, PHI = 0;
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.0, 0.0, 0.0, 0.0);
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
    GL.bindBuffer(GL.ARRAY_BUFFER, cubeVbo);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4*(3+3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4*(3+3), 3*4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cubeFbo);
    GL.drawElements(GL.TRIANGLES, 6*2*3, GL.UNSIGNED_SHORT, 0);
    GL.flush();
    window.requestAnimationFrame(animate);
  }
  animate(0);
}
  
  window.addEventListener("load", startWebgl);
  
