/*
 * Skyroads WebGL
 * by Piotr Pokojowczyk
 * piotrpokojowczyk@gmail.com
 * http://pokojowczyk.pl/
 */
 // WebGL - Multiple Objects - Manual
 // from https://webglfundamentals.org/webgl/webgl-multiple-objects-manual.html

 "use strict";

 function main() {

   // Get A WebGL context
   /** @type {HTMLCanvasElement} */
   var canvas = document.getElementById("glcanvas");
   var gl = canvas.getContext("webgl");
   if (!gl) {
     return;
   }

   var vehicle = null;

   var createFlattenedVertices = function(gl, vertices) {
     return webglUtils.createBufferInfoFromArrays(
         gl,
         primitives.makeRandomVertexColors(
             primitives.deindexVertices(vertices),
             {
               vertsPerColor: 6,
               rand: function(ndx, channel) {
                 return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
               }
             })
       );
   };

   // var cubeBufferInfo = createFlattenedVertices(gl, primitives.createRectangleVertices(40));
   var trackBuffers = [];

   /* this function creates a whole track from blocks */
   function initTrackBuffers(callback){
     trackBuffers = [];
     var voffset = -18;
     var translation = 0;
     Tracks.currentTrack.forEach(function(row){
       var hoffset = -3;
       row.forEach(function(block){
         if(block === '#'){
           var buffer = createFlattenedVertices(gl, primitives.createRectangleVertices2(40, [hoffset, 0, voffset]));
           trackBuffers.push(buffer);
         }
         hoffset += 1;
       });
       voffset += 1;
     });
     callback();
   }

   // setup GLSL program
   var programInfo = webglUtils.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

   function degToRad(d) {
     return d * Math.PI / 180;
   }

   var cameraAngleRadians = degToRad(0);
   var fieldOfViewRadians = degToRad(90);
   var cameraHeight = 50;

   var cubeUniforms = {
     u_colorMult: [1, 0.5, 0.5, 1],
     u_matrix: m4.identity(),
   };
   var cubeTranslation   = [0, 0, 0];

   function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
     var matrix = m4.translate(viewProjectionMatrix,
         translation[0],
         translation[1],
         translation[2]);
     //matrix = m4.xRotate(matrix, xRotation);
     return matrix;
   }

   // Render every object
   trackBuffers.forEach(function(buff){
     gl.useProgram(programInfo.program);
     cubeUniforms.u_matrix = computeMatrix(viewProjectionMatrix, cubeTranslation, 0, 0);
     webglUtils.setBuffersAndAttributes(gl, programInfo, buff);
     webglUtils.setUniforms(programInfo, cubeUniforms);
     gl.drawArrays(gl.TRIANGLES, 0, buff.numElements);
   });

   var vbuffer;
   var aspect = 1;
   var vertices = [
      -0.5, 0.5 * aspect, 0.5, 0.5 * aspect,  0.5, -0.5 * aspect,
      -0.5, 0.5 * aspect, 0.5,-0.5 * aspect, -0.5, -0.5 * aspect
   ];
             var textureCoords = [
              0.0, 0.0,
              1.0, 0.0,
              1.0, 1.0,
              0.0, 0.0,
              1.0, 1.0,
              0.0, 1.0,
            ];

  /* This function renders sprite of the vehicle */
  function renderVehicle(gl){

      var vehicle = gl.createTexture();
      var numItems = 0;

      var aVertexPosition = gl.getAttribLocation(programInfo.program, "aVertexPosition");
      var aTextureCoord = gl.getAttribLocation(programInfo.program, "aTextureCoord");

      gl.bindTexture(gl.TEXTURE_2D, vehicle);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.querySelector('#vehicle'));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);

      var vbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      numItems = vertices.length / 2;

      var tbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

      aVertexPosition = gl.getAttribLocation(programInfo.program, "aVertexPosition");
      gl.enableVertexAttribArray(aVertexPosition);

      aTextureCoord = gl.getAttribLocation(programInfo.program, "aTextureCoord");
      gl.enableVertexAttribArray(aTextureCoord);

      var uSampler = gl.getUniformLocation(programInfo.program, "uSampler");

      gl.drawArrays(gl.TRIANGLES, 0, numItems);
  }

   // Draw the scene.
   function drawScene(time) {

     // webglUtils.resizeCanvasToDisplaySize(gl.canvas);
     // Tell WebGL how to convert from clip space to pixels
     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
     gl.enable(gl.CULL_FACE);
     gl.enable(gl.DEPTH_TEST);
     // Clear the canvas AND the depth buffer.
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     // Compute the projection matrix
     var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
     var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

     // Compute the camera's matrix using look at.
     var cameraPosition = [0, 100, 28000];
     var target = [0, 10, 0];
     var up = [0, 1, 0];
     var cameraMatrix = m4.lookAt(cameraPosition, target, up);

     // Make a view matrix from the camera matrix.
     var viewMatrix = m4.inverse(cameraMatrix);
     var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
     cubeTranslation = [0, 0, (cubeTranslation[2] + 60)];

     // Render every object
     trackBuffers.forEach(function(buff){
       gl.useProgram(programInfo.program);
       cubeUniforms.u_matrix = computeMatrix(viewProjectionMatrix, cubeTranslation, 0, 0);
       webglUtils.setBuffersAndAttributes(gl, programInfo, buff);
       webglUtils.setUniforms(programInfo, cubeUniforms);
       gl.drawArrays(gl.TRIANGLES, 0, buff.numElements);
     });

     renderVehicle(gl);

     requestAnimationFrame(drawScene);
   }

   initTrackBuffers(function(){
     requestAnimationFrame(drawScene);
   });
 }
