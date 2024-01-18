function main() {
    var CANVAS = document.getElementById("webgl-target");
    CANVAS.width = 1080;
    CANVAS.height = 720;
    var AMORTIZATION = 0.95;
    var drag = false;
    var x_prev, y_prev;
    var dX = 0, dY = 0;
    var mouseDown = function(e) {
      drag = true;
      x_prev = e.pageX, y_prev = e.pageY;
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
      x_prev = e.pageX, y_prev = e.pageY;
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
  uniform sampler2D sampler;\n\
  varying vec2 vUV;\n\
  void main(void) {\n\
  gl_FragColor = texture2D(sampler, vUV);}';
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
    var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "sampler");
    var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_uv);
    GL.enableVertexAttribArray(_position);
    GL.useProgram(SHADER_PROGRAM);
    GL.uniform1i(_sampler, 0);
    var cube_vertex = [
      -1,-1,-1,    0,0,
      1,-1,-1,     1,0,
      1, 1,-1,     1,1,
      -1, 1,-1,    0,1,
  
      -1,-1, 1,    0,0,
      1,-1, 1,     1,0,
      1, 1, 1,     1,1,
      -1, 1, 1,    0,1,
  
      -1,-1,-1,    0,0,
      -1, 1,-1,    1,0,
      -1, 1, 1,    1,1,
      -1,-1, 1,    0,1,
  
      1,-1,-1,     0,0,
      1, 1,-1,     1,0,
      1, 1, 1,     1,1,
      1,-1, 1,     0,1,
  
      -1,-1,-1,    0,0,
      -1,-1, 1,    1,0,
      1,-1, 1,     1,1,
      1,-1,-1,     0,1,
  
      -1, 1,-1,    0,0,
      -1, 1, 1,    1,0,
      1, 1, 1,     1,1,
      1, 1,-1,     0,1
    ];
    var CUBE_VERTEX = GL.createBuffer();
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
    var PROJMATRIX_RTT = UTILS.getProjection(20, 1, 1, 100);
    var MOVEMATRIX = UTILS.getId4();
    var VIEWMATRIX = UTILS.getId4();
    var MOVEMATRIXAUTO = UTILS.getId4();
    UTILS.translateZ(VIEWMATRIX, -5);
    var THETA = 0, PHI = 0;
    var load_texture = function(image_URL){
      var texture = GL.createTexture();
      var image = new Image();
      image.src = image_URL;
      image.onload = function(e) {
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
        GL.bindTexture(GL.TEXTURE_2D, null);
      };
      return texture;
    };
    var cube_texture = load_texture("img/texturetest.png");
    var fb = GL.createFramebuffer();
    GL.bindFramebuffer(GL.FRAMEBUFFER, fb);
    var rb = GL.createRenderbuffer();
    GL.bindRenderbuffer(GL.RENDERBUFFER, rb);
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16 , 512, 512);
    var texture_rtt = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, texture_rtt);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 512, 512, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture_rtt, 0);
    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, rb);
    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindRenderbuffer(GL.RENDERBUFFER, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
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
      GL.bindFramebuffer(GL.FRAMEBUFFER, fb);
      GL.viewport(0, 0, 512, 512);
      GL.clearColor(1.0, 1.0, 1.0, 1.0);
      UTILS.rotateY(MOVEMATRIXAUTO, dt*0.0001);
      UTILS.rotateX(MOVEMATRIXAUTO, dt*0.0002);
      UTILS.rotateZ(MOVEMATRIXAUTO, dt*0.0003);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
      GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX_RTT);
      GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
      GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIXAUTO);
      GL.activeTexture(GL.TEXTURE0);
      GL.bindTexture(GL.TEXTURE_2D, cube_texture);
      GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
      GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4*(3+2), 0);
      GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4*(3+2), 3*4);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
      GL.drawElements(GL.TRIANGLES, 6*2*3, GL.UNSIGNED_SHORT, 0);
      GL.flush();
      GL.bindTexture(GL.TEXTURE_2D, null);
      GL.bindFramebuffer(GL.FRAMEBUFFER, null);
      UTILS.resetId4(MOVEMATRIX);
      UTILS.rotateY(MOVEMATRIX, THETA);
      UTILS.rotateX(MOVEMATRIX, PHI);
      time_prev = time;
      GL.viewport(0, 0, CANVAS.width, CANVAS.height);
      GL.clearColor(0.0, 0.0, 0.0, 0.0);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
      GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
      GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
      GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
      GL.bindTexture(GL.TEXTURE_2D, texture_rtt);
      GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
      GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4*(3+2), 0);
      GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4*(3+2), 3*4);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
      GL.drawElements(GL.TRIANGLES, 6*2*3, GL.UNSIGNED_SHORT, 0);
      GL.flush();
      window.requestAnimationFrame(animate);
    };
    animate(0);
  }
  
  window.addEventListener('load', main);