// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() { 
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`
// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}
function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_FragColor
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const rainbowColors = [
  [1.0, 0.0, 0.0, 1.0], // red
  [1.0, 0.5, 0.0, 1.0], // orange
  [1.0, 1.0, 0.0, 1.0], // yellow
  [0.0, 1.0, 0.0, 1.0], // green
  [0.0, 0.0, 1.0, 1.0], // blue
  [0.29, 0.0, 0.51, 1.0], // indigo
  [0.58, 0.0, 0.83, 1.0]  // violet
];
// globals related UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_rainbowMode = false;
let rainbowIndex = 0;
function addActionsForHtmlUI() {
  // Button events (Shape type)
  document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; g_rainbowMode = false; };
  document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; g_rainbowMode = false; };
  document.getElementById('rainbow').onclick = function () {
    g_rainbowMode = !g_rainbowMode
    if (!g_rainbowMode) g_selectedColor = [1.0, 1.0, 1.0, 1.0]
  };
  document.getElementById('clearButton').onclick = function () { g_shapesList = []; renderAllShapes(); };

  document.getElementById('pointButton').onclick = function () { g_selectedType = POINT };
  document.getElementById('triButton').onclick = function () { g_selectedType = TRIANGLE };
  document.getElementById('circleButton').onclick = function () { g_selectedType = CIRCLE };
  document.getElementById('recreateButton').onclick = function () { recreateDrawing(); };
  // Slider events
  document.getElementById('redSlide').addEventListener('mouseup', function () {
    g_selectedColor[0] = this.value / 100;
    g_rainbowMode = false;
  });
  document.getElementById('greenSlide').addEventListener('mouseup', function () {
    g_selectedColor[1] = this.value / 100;
    g_rainbowMode = false;
  });
  document.getElementById('blueSlide').addEventListener('mouseup', function () {
    g_selectedColor[2] = this.value / 100;
    g_rainbowMode = false;
  });

  // Size Slider
  document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectedSize = this.value; });
  document.getElementById('segmentsSlide').addEventListener('mouseup', function () { g_selectedSegments = this.value; });
}
function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {

  if (g_rainbowMode) {
    updateRainbowColor();
  }
  let [x, y] = convertCoordinatesEventToGL(ev);

  // create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // Draw every shape that is supposed to be on canvas
  renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return ([x, y]);
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;

  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Check the time at the end of the function and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}
// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlE1m = document.getElementById(htmlID);
  if (!htmlE1m) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlE1m.innerHTML = text;
}
function updateRainbowColor() {
  g_selectedColor = rainbowColors[rainbowIndex];
  rainbowIndex = (rainbowIndex + 1) % rainbowColors.length;
}
function recreateDrawing() {
  g_shapesList = [];
  renderAllShapes();

  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.4, 1, -.25, .91, -.45, .86]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.25, .91, -.25, .86, -.45, .86]);
  gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0]);
  drawTriangle([-.7, .76, -.45, .86, -.7, .62]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.7, .62, -.45, .86, -.5, .67]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.7, .62, -.5, .67, -.75, .53]);
  gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0]);
  drawTriangle([-.75, .53, -.5, .67, -.65, .43]);
  gl.uniform4fv(u_FragColor, [0.8, 0.0, 0.1, 1.0]);
  drawTriangle([-.65, .43, -.5, .67, -.5, .38]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.5, .38, -.5, .67, -.2, .43]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.45, .86, -.25, .86, -.5, .67]);
  gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0]);
  drawTriangle([-.2, .43, -.5, .67, -.25, .86]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.25, .86, -.1, .72, -.2, .43]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.2, .43, -.1, .72, -.05, .38]);

  drawTriangle([-.6, .19, -.5, .38, -.25, .19]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.5, .38, -.2, .43, -.25, .19]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([-.2, .43, -.05, .38, -.25, .19]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.25, .19, -.05, .38, -.05, .19]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([-.6, .19, -.25, .19, -.6, .01]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.6, .01, -.25, .19, -.2, 0]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([-.25, .19, -.05, .19, -.2, 0]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.05, .19, -.05, -.05, -.2, 0]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.6, .01, -.2, 0, -.2, -.33]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.6, .01, -.2, -.33, -.35, -.48]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([-.2, 0, -.05, -.05, -.2, -.33]);
  drawTriangle([-.05, .38, .3, .15, -.05, -.05]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.05, -.05, .3, .15, .25, -.19]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.05, -.05, .24, -.33, -.20, -.33]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.05, -.05, .55, -.33, .24, -.33]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([.3, .15, .55, -.33, .25, -.19]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.2, -.33, -.15, -.61, -.35, -.48]); //
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.2, -.33, .2, -.61, -.15, -.61]);
  gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0]);
  drawTriangle([-.2, -.33, .24, -.33, .2, -.61]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([.24, -.33, .55, -.33, .2, -.61]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([.55, -.33, .6, -.62, .2, -.61]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.35, -.48, -.15, -.61, -.35, -.95]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.35, -.48, -.35, -.95, -.4, -.81]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.35, -.95, -.45, -.95, -.4, -.81]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.45, -.95, -.5, -.81, -.4, -.81]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.45, -.95, -.55, -.90, -.5, -.81]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([-.15, -.61, .2, -.61, .1, -.85]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([.1, -.85, .2, -.61, .35, -.85]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([.35, -.85, .2, -.61, .6, -.61]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([.35, -.85, .6, -.61, .4, -1]);
  gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0]);
  drawTriangle([.6, -.61, .6, -1, .4, -1]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([.1, -.85, .35, -.85, .4, -1]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([-.1, -1, .1, -.85, .4, -1]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.15, -.85, .1, -.85, -.1, -1]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([-.15, -.85, -.1, -1, -.25, -.95]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([-.1, -1, -.25, -1, -.25, -.95]);

  drawTriangle([.6, -.62, .75, -.66, .6, -.75]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([.6, -.62, .7, -.57, .75, -.66]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([.75, -.66, .7, -.57, .85, -.52]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([.85, -.52, .7, -.57, .81, -.37]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([.81, -.37, .7, -.57, .8, -.28]);
  drawTriangle([.85, -.52, .81, -.37, .9, -.24]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([.9, -.24, .81, -.37, .8, -.28]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([.85, .1, .9, -.24, .8, -.28]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([.85, .1, .8, -.28, .75, .29]);
  gl.uniform4fv(u_FragColor, [0.75, 0.0, 0.0, 1.0]);
  drawTriangle([.85, .33, .85, .1, .75, .29]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([.85, .33, .75, .29, .8, .43]);
  gl.uniform4fv(u_FragColor, [1.0, 0, 0, 1.0]);
  drawTriangle([1, .48, .85, .33, .8, .43]);
  gl.uniform4fv(u_FragColor, [0.5, 0.0, 0.0, 1.0]);
  drawTriangle([1, .48, .8, .43, .9, .53]);
}