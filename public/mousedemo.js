function main() {
  var CANVAS = document.getElementById("webgl-target");
  CANVAS.width = 1080;
  CANVAS.height = 720;
  var AMORTIZATION = 0.95;
  var drag = false;
  var x_prev, y_prev;
  var dX = 0;
  var dY = 0;
  var mouseDown = function(e) {
    drag = true;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
    return false;
  };
  var mouseUp = function(e){
    drag = false;
  };
  var mouseMove = function(e) {
    if (!drag) return false;
      dX = (e.pageX-x_prev) * 2 * Math.PI / CANVAS.width,
      dY = (e.pageY-y_prev) * 2 * Math.PI / CANVAS.height;
      THETA += dX;
      PHI += dY;
      x_prev = e.pageX;
      y_prev = e.pageY;
      e.preventDefault();
  };
  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);
  var GL;
  try {
    GL = CANVAS.getContext("webgl", {antialias: true});
  } catch (e) {
    alert("WebGL context cannot be initialized");
    return false;
  }
  var shader_vertex_source = 'attribute vec3 position;\n\
uniform mat4 Pmatrix, Vmatrix, Mmatrix;\n\
attribute vec3 color;\n\
varying vec3 vColor;\n\
void main(void){\n\
gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
vColor = color;}';
  var shader_fragment_source = 'precision mediump float;\n\
varying vec3 vColor;\n\
void main(void){\n\
gl_FragColor = vec4(vColor, 1.);}';
  var compile_shader = function(source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
      return false;
    }
    return shader;
  };
  var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
  var SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);
  GL.linkProgram(SHADER_PROGRAM);
  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
  var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  GL.enableVertexAttribArray(_color);
  GL.enableVertexAttribArray(_position)
  GL.useProgram(SHADER_PROGRAM);
  var cube_vertex = [
    -1,-1,-1,     1,1,0,
    1,-1,-1,     1,1,0,
    1, 1,-1,     1,1,0,
    -1, 1,-1,     1,1,0,
  
    -1,-1, 1,     0,0,1,
    1,-1, 1,     0,0,1,
    1, 1, 1,     0,0,1,
    -1, 1, 1,     0,0,1,
  
    -1,-1,-1,     0,1,1,
    -1, 1,-1,     0,1,1,
    -1, 1, 1,     0,1,1,
    -1,-1, 1,     0,1,1,
  
    1,-1,-1,     1,0,0,
    1, 1,-1,     1,0,0,
    1, 1, 1,     1,0,0,
    1,-1, 1,     1,0,0,
  
    -1,-1,-1,     1,0,1,
    -1,-1, 1,     1,0,1,
    1,-1, 1,     1,0,1,
    1,-1,-1,     1,0,1,
  
    -1, 1,-1,     0,1,0,
    -1, 1, 1,     0,1,0,
    1, 1, 1,     0,1,0,
    1, 1,-1,     0,1,0
  ];
  var CUBE_VERTEX= GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube_vertex), GL.STATIC_DRAW);
  var cube_faces = [
    0,1,2,
    0,2,3,
  
    4,5,6,
    4,6,7,
  
    8,9,10,
    8,10,11,
  
    12,13,14,
    12,14,15,
  
    16,17,18,
    16,18,19,
  
    20,21,22,
    20,22,23
  ];
  var CUBE_FACES = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_faces), GL.STATIC_DRAW);
  var PROJMATRIX = UTILS.getProjection(40, CANVAS.width/CANVAS.height, 1, 100);
  var MOVEMATRIX = UTILS.getId4();
  var VIEWMATRIX = UTILS.getId4();
  UTILS.translateZ(VIEWMATRIX, -6);
  var THETA = 0;
  var PHI = 0;
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.0, 0.0, 0.0, 0.0);
  GL.clearDepth(1.0);
  var time_prev = 0;
  var animate = function(time) {
    var dt = time - time_prev;
    if (!drag) {
      dX *= AMORTIZATION, dY *= AMORTIZATION;
      THETA += dX, PHI += dY;
    }
    UTILS.resetId4(MOVEMATRIX);
    UTILS.rotateY(MOVEMATRIX, THETA);
    UTILS.rotateX(MOVEMATRIX, PHI);
    time_prev = time;
    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4*(3+3), 0);
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4*(3+3), 3*4);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.drawElements(GL.TRIANGLES, 6*2*3, GL.UNSIGNED_SHORT, 0);
    GL.flush();
    window.requestAnimationFrame(animate);
  };
  animate(0);
}
  
  window.addEventListener('load', main);