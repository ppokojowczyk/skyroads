

/*
 * Skyroads WebGL
 * by Piotr Pokojowczyk
 * piotrpokojowczyk@gmail.com
 * http://pokojowczyk.pl/
 */
function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');
  if ( !gl ) { alert('You software does NOT support WebGL'); return; } // WebGL is required.

  const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // Fragment shader program
  const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  const roadBlocks = [];

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  var positions = [0, 0, 0, 0, 0, 0, 0, 0 ];
  var frame = 0;
  var maxFrames = 1000;

  function renderRowOfRoadBlocks(){}
  function animateRoadBlocks(){}

  function updateRoadBlockPositions(positions){

    var speedFactor = 1;

    /* move all eight corners */
    positions[0] += 0.015 * speedFactor;
    positions[1] -= 0.01 * speedFactor;

    positions[2] += 0.01 * speedFactor;
    positions[3] -= 0.01 * speedFactor;

    positions[4] += 0.035 * speedFactor;
    positions[5] -= 0.02 * speedFactor;

    positions[6] += 0.02 * speedFactor;
    positions[7] -= 0.02 * speedFactor;
  }

  /* This function in final should animate one block */
  function animateRoad(){

    if ( frame == maxFrames ) return;

    updateRoadBlockPositions(positions);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    drawScene(gl, programInfo, buffers);
    frame++;
    //requestAnimationFrame(animateRoad);
  }

  //requestAnimationFrame(animateRoad);
  drawScene(gl, programInfo, buffers);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl) {

  var trackBlocks = [];
  var voffset = 0;
  Tracks.currentTrack.forEach(function(row){
    var hoffset = 0;
    row.forEach(function(block){
      if(block === '#'){
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        var positions = [0 + hoffset, 0 + voffset, -1 + hoffset, 0 + voffset, 0 + hoffset, -1 + voffset, -1 + hoffset, -1 + voffset]; // start from center
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        trackBlocks.push(buffer);
      }
      hoffset += 1;
    });
    voffset += 1;
  });
  return trackBlocks;
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers) {

  gl.useProgram(programInfo.program);
  gl.clearColor(0.0, 0.0, 0.0, 0.5);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for(var i in buffers){

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-5.0, -12.0, -40.0]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL to use our program when drawing



  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }

  }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

var Tracks = {
  load: function(trackName = ''){

    var self = this;
    if ( !trackName ) { return false; }
    var XHR = new XMLHttpRequest();
    XHR.open('GET', '/lib/track-1.trk');
    XHR.onreadystatechange = function(){
      if (this.readyState == 4 && this.status == 200) {
          self.prepareTrack(XHR.responseText);
      }
    }
    XHR.send();
  },
  currentTrack: [], // keep current track here
  prepareTrack: function(data){
    var self = this;
    // this functions converts the text file into track data
    var tmp = data.split("\n");
    var data = [];
    for(var line in tmp){
      var lineData = tmp[line];
      var row = [];
      var t;
      for(t = 0; t < 7; t++){
        if(lineData[t] && lineData[t] != ' '){
          row[t] = lineData[t];
        } else {
          row[t] = null;
        }
      }
      data.push(row);
    }
    self.currentTrack = data;
    main();
  }
};

Tracks.load('track-1');
