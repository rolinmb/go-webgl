function startWebgl() {
    console.log("Attempting to start WebGL");
    var CANVAS = document.getElementById("webgl-target");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    var GL;
    try {
      GL = CANVAS.getContext("webgl", {antialias: true});
    } catch (e) {
      alert("WebGL context cannot be initialized");
      return false;
    }
    console.log("WebGL has been successfully initialized");
    var shaderVertexSrc = 'attribute vec2 position;\n\
    attribute vec3 color;\n\
    varying vec3 vColor;\n\
    void main(void){\n\
    gl_Position = vec4(position, 0., 1.);\n\
    vColor = color;}';
    var shaderFragmentSrc = 'precision mediump float;\n\
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
    var _color = GL.getAttribLocation(shaderProgram, "color");
    var _position = GL.getAttribLocation(shaderProgram, "position");
    GL.enableVertexAttribArray(_color);
    GL.enableVertexAttribArray(_position);
    GL.useProgram(shaderProgram);
    console.log("Successfully linked program shaders and is ready to render to context/target");
    var triVertices = [
      -1, -1, 0, 0, 1, // vertex (-1,-1)
      1, -1, 1, 1, 0,  // vertex (1,-1)
      1, 1, 1, 0, 0   // vertex (1,1) 
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
    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    console.log('Starting WebGL render to <canvas id="webgl-target"> context');
    var animate = function() {
      GL.viewport(0, 0, CANVAS.width, CANVAS.height);
      GL.clear(GL.COLOR_BUFFER_BIT);
      GL.bindBuffer(GL.ARRAY_BUFFER, triVbo);
      GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4*(2+3), 0);
      GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4*(2+3), 2*4);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, triFbo);
      GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
      GL.flush();
      window.requestAnimationFrame(animate);
    }
    animate();
  }
  
  window.addEventListener("load", startWebgl);
  