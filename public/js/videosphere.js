function main() {
    var CANVAS = document.getElementById("webgl-target");
    CANVAS.width = 1080;
    CANVAS.height = 720;
    var AMORTIZATION = 0.9;
    var drag = false;
    var x_prev, y_prev;
    var dX = 0, dY = 0;
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
      dX = (e.pageX-x_prev) * Math.PI / CANVAS.width,
      dY = (e.pageY-y_prev) * Math.PI / CANVAS.height;
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
  attribute vec2 uv;\n\
  varying vec2 vUV;\n\
  void main(void) {\n\
  gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);\n\
  vUV = uv;}';
    var shader_fragment_source = 'precision mediump float;\n\
  uniform sampler2D samplerVideo;\n\
  varying vec2 vUV;\n\
  void main(void) {\n\
  gl_FragColor = texture2D(samplerVideo, vUV);}';
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
    var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "samplerVideo");
    var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_uv);
    GL.enableVertexAttribArray(_position);
    GL.useProgram(SHADER_PROGRAM);
    GL.uniform1i(_sampler, 0);
    var nCrowns = 64; // number of crowns for the sphere mesh
    var nBands = 32;  // number of bands for the sphere mesh
    var nVertices = 0;
    var sphere_vertices = [];
    var sphere_indices = [];
    var c, b, rho1, rho2;
    for (c = 0; c <= nCrowns; c++) {
        rho2 = Math.PI* c / nCrowns; 
        for (b=0; b<=nBands; b++) {
          rho1 = 2*Math.PI * b / nBands;
          sphere_vertices.push(Math.cos(rho1) * Math.sin(rho2),  // X
                               Math.cos(rho2),                    // Y,
                               Math.sin(rho1) * Math.sin(rho2),  // Z
                               rho1 / (2*Math.PI),              // U
                               rho2 / Math.PI);                   // V
          if (c!==0) { //add a triangle face
            sphere_indices.push(c*(nBands+1)+b, c*(nBands+1)+b-1, (c-1)*(nBands+1)+b);
            nVertices += 3;
          }
          if (c!==0 && c!==1) { //add an other triangle face
            sphere_indices.push(c*(nBands+1)+b-1, (c-1)*(nBands+1)+b, (c-1)*(nBands+1)+b-1);
            nVertices += 3;
          }
        }             
      }
      var SPHERE_VERTICES = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, SPHERE_VERTICES);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(sphere_vertices), GL.STATIC_DRAW);
      var SPHERE_INDICES = GL.createBuffer();
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, SPHERE_INDICES);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere_indices), GL.STATIC_DRAW);
  var PROJMATRIX = UTILS.getProjection(40, CANVAS.width/CANVAS.height, 1, 100);
  var MOVEMATRIX = UTILS.getId4();
  var VIEWMATRIX = UTILS.getId4();
  UTILS.translateZ(VIEWMATRIX, -6);
  var THETA = 0;
  var PHI = 0;
  var video = document.getElementById("test-vid");
  var texture = GL.createTexture();
  GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
  GL.bindTexture(GL.TEXTURE_2D, texture);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
  GL.bindTexture(GL.TEXTURE_2D, null);
  var refresh_texture = function() {
    GL.bindTexture(GL.TEXTURE_2D, texture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, video);
  };
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearDepth(1.0);
  GL.clearColor(15/255, 50/255, 32/255, 1.0);
  GL.bindBuffer(GL.ARRAY_BUFFER, SPHERE_VERTICES);
  GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4*(3+2), 0);
  GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4*(3+2), 3*4);
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, SPHERE_INDICES);
  var time_prev = 0;
  var pvtime = 0;
  var animate = function(time) {
      //var dt = time - time_prev;
      if (!drag) {
        dX *= AMORTIZATION, dY *= AMORTIZATION;
        THETA += dX, PHI += dY;
      }
      UTILS.resetId4(MOVEMATRIX);
      UTILS.rotateY(MOVEMATRIX, THETA);
      UTILS.rotateX(MOVEMATRIX, PHI);
      GL.viewport(0, 0, CANVAS.width, CANVAS.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
      GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
      GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
      GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
      if (video.currentTime > 0 && video.currentTIme !== pvtime) {
        pvtime = video.currentTime;
        if (video.currentTime === video.duration) {video.currentTime = 0;}
        GL.activeTexture(GL.TEXTURE0);
        refresh_texture();
      }
      GL.drawElements(GL.TRIANGLES, nVertices, GL.UNSIGNED_SHORT, 0);
      GL.flush();
      window.requestAnimationFrame(animate);
  };
  animate(0);
}
  
window.addEventListener('load', main);