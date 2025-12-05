/* js/state.js */
// Global DOM references
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');
const colorInput = document.getElementById('color-picker');
const hexInput = document.getElementById('hex-input');
const dragSource = document.getElementById('drag-source');
const frameList = document.getElementById('frame-list');
// Main State Object
const state = {
   width: 32,
   height: 32,
   scale: 16,
   frames: [],
   currentFrameIndex: 0,
   tool: 'pen',
   brushSize: 1,
   color: '#000000',
   palette: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'],
   isDrawing: false,
   isPlaying: true,
   fps: 8,
   previewScale: 4,
   history: [],
   historyIndex: -1,
   mouseX: -1,
   mouseY: -1,
   startDragX: -1,
   startDragY: -1,
   showGrid: true,
   showOnionSkin: false,
   mirrorX: false,
   mirrorY: false,
   paintedPixels: new Set(),
   saveTimeout: null,
   // SELECTION STATE
   selection: {
       active: false,
       x: 0, y: 0, w: 0, h: 0,
       buffer: null,
       isDragging: false,
       originX: 0, originY: 0
   },
   clipboard: null
};