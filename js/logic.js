/* js/logic.js */
// --- STATE MANAGEMENT ---
function saveState() {
   try {
       const data = {
           width: state.width,
           height: state.height,
           fps: state.fps,
           palette: state.palette,
           frames: state.frames.map(f => Array.from(f.data))
       };
       localStorage.setItem('spriteCreatorData', JSON.stringify(data));
       showSaveIndicator();
   } catch (e) {
       console.error("Auto-save failed:", e);
   }
}
function loadState() {
   const raw = localStorage.getItem('spriteCreatorData');
   if (!raw) return false;
   try {
       const data = JSON.parse(raw);
       if(!data.width || !data.height || !data.frames) return false;
       state.width = data.width;
       state.height = data.height;
       state.fps = data.fps || 8;
       state.palette = data.palette || state.palette;
       state.frames = data.frames.map(fData => {
           const u8 = new Uint8ClampedArray(fData);
           return new ImageData(u8, state.width, state.height);
       });
       state.currentFrameIndex = 0;
       document.getElementById('size-input').value = state.width;
       document.getElementById('fps-slider').value = state.fps;
       document.getElementById('fps-display').innerText = state.fps;
       return true;
   } catch (e) {
       console.error("Save file corrupt:", e);
       return false;
   }
}
function showSaveIndicator() {
   const indicator = document.getElementById('autosave-indicator');
   indicator.style.opacity = 1;
   if(state.saveTimeout) clearTimeout(state.saveTimeout);
   state.saveTimeout = setTimeout(() => {
       indicator.style.opacity = 0;
   }, 1000);
}
// --- SELECTION LOGIC ---
function isMouseInSelection(x, y) {
   if (!state.selection.active) return false;
   return x >= state.selection.x && x < state.selection.x + state.selection.w &&
          y >= state.selection.y && y < state.selection.y + state.selection.h;
}
function captureSelection() {
   const frame = state.frames[state.currentFrameIndex];
   let selX = state.selection.x;
   let selY = state.selection.y;
   let selW = state.selection.w;
   let selH = state.selection.h;
   if (!state.selection.active) {
       selX = 0; selY = 0;
       selW = state.width; selH = state.height;
   }
   const rawData = new ImageData(selW, selH);
   for(let py=0; py<selH; py++) {
       for(let px=0; px<selW; px++) {
           if(selX + px >= 0 && selX + px < state.width && selY + py >= 0 && selY + py < state.height) {
               const srcIdx = ((selY + py) * state.width + (selX + px)) * 4;
               const dstIdx = (py * selW + px) * 4;
               rawData.data[dstIdx] = frame.data[srcIdx];
               rawData.data[dstIdx+1] = frame.data[srcIdx+1];
               rawData.data[dstIdx+2] = frame.data[srcIdx+2];
               rawData.data[dstIdx+3] = frame.data[srcIdx+3];
           }
       }
   }
   return rawData;
}
function eraseUnderSelection() {
    const frame = state.frames[state.currentFrameIndex];
    for(let py=0; py<state.selection.h; py++) {
       for(let px=0; px<state.selection.w; px++) {
           const tx = state.selection.x + px;
           const ty = state.selection.y + py;
           if(tx >= 0 && tx < state.width && ty >= 0 && ty < state.height) {
               const srcIdx = (ty * state.width + tx) * 4;
               frame.data[srcIdx+3] = 0;
           }
       }
   }
}
function liftSelection() {
   if (state.selection.buffer) return;
   state.selection.buffer = captureSelection();
   eraseUnderSelection();
   state.selection.isDragging = true;
   state.selection.originX = state.mouseX - state.selection.x;
   state.selection.originY = state.mouseY - state.selection.y;
}
function addPixelToSelection(x, y) {
   if (x < 0 || x >= state.width || y < 0 || y >= state.height) return;
   if (!state.selection.active || !state.selection.buffer) {
       state.selection.x = x;
       state.selection.y = y;
       state.selection.w = 1;
       state.selection.h = 1;
       state.selection.buffer = captureSelection();
       eraseUnderSelection();
       state.selection.active = true;
       renderEditor();
       return;
   }
   const oldX = state.selection.x;
   const oldY = state.selection.y;
   const oldW = state.selection.w;
   const oldH = state.selection.h;
   const oldBuf = state.selection.buffer;
   const newX = Math.min(oldX, x);
   const newY = Math.min(oldY, y);
   const maxX = Math.max(oldX + oldW, x + 1);
   const maxY = Math.max(oldY + oldH, y + 1);
   const newW = maxX - newX;
   const newH = maxY - newY;
   const newBuf = new ImageData(newW, newH);
   for(let py=0; py<oldH; py++){
       for(let px=0; px<oldW; px++){
           const srcIdx = (py * oldW + px) * 4;
           if(oldBuf.data[srcIdx+3] > 0) {
               const dstX = (oldX + px) - newX;
               const dstY = (oldY + py) - newY;
               const dstIdx = (dstY * newW + dstX) * 4;
               newBuf.data[dstIdx] = oldBuf.data[srcIdx];
               newBuf.data[dstIdx+1] = oldBuf.data[srcIdx+1];
               newBuf.data[dstIdx+2] = oldBuf.data[srcIdx+2];
               newBuf.data[dstIdx+3] = oldBuf.data[srcIdx+3];
           }
       }
   }
   const frame = state.frames[state.currentFrameIndex];
   const srcIdx = (y * state.width + x) * 4;
   if (frame.data[srcIdx+3] > 0) {
       const dstX = x - newX;
       const dstY = y - newY;
       const dstIdx = (dstY * newW + dstX) * 4;
       newBuf.data[dstIdx] = frame.data[srcIdx];
       newBuf.data[dstIdx+1] = frame.data[srcIdx+1];
       newBuf.data[dstIdx+2] = frame.data[srcIdx+2];
       newBuf.data[dstIdx+3] = frame.data[srcIdx+3];
       frame.data[srcIdx+3] = 0;
   }
   state.selection.x = newX;
   state.selection.y = newY;
   state.selection.w = newW;
   state.selection.h = newH;
   state.selection.buffer = newBuf;
   renderEditor();
}
function anchorSelection() {
   if (!state.selection.active || !state.selection.buffer) {
       state.selection.active = false;
       state.selection.buffer = null;
       return;
   }
   const frame = state.frames[state.currentFrameIndex];
   const buffer = state.selection.buffer;
   for(let py=0; py<state.selection.h; py++) {
       for(let px=0; px<state.selection.w; px++) {
           const targetX = state.selection.x + px;
           const targetY = state.selection.y + py;
           if (targetX >= 0 && targetX < state.width && targetY >= 0 && targetY < state.height) {
               const srcIdx = (py * state.selection.w + px) * 4;
               const dstIdx = (targetY * state.width + targetX) * 4;
               if (buffer.data[srcIdx+3] > 0) {
                   frame.data[dstIdx] = buffer.data[srcIdx];
                   frame.data[dstIdx+1] = buffer.data[srcIdx+1];
                   frame.data[dstIdx+2] = buffer.data[srcIdx+2];
                   frame.data[dstIdx+3] = buffer.data[srcIdx+3];
               }
           }
       }
   }
   state.selection.active = false;
   state.selection.buffer = null;
   commitToHistory();
   updateFrameThumb(state.currentFrameIndex);
   renderEditor();
}
function deleteSelection() {
   if(state.selection.active) {
       if (!state.selection.buffer) {
            eraseUnderSelection();
       }
       state.selection.buffer = null;
       state.selection.active = false;
       commitToHistory();
       renderEditor();
   } else {
       clearCanvas();
   }
}
// --- DRAWING & RENDERING ---
function draw(e) {
   if (state.tool === 'select') {
       if (state.selection.isDragging) {
           state.selection.x = state.mouseX - state.selection.originX;
           state.selection.y = state.mouseY - state.selection.originY;
           renderEditor();
       } else if (state.isDrawing) {
           renderEditor();
       }
       return;
   }
   if (!state.isDrawing) return;
   if (['line', 'rect', 'circle'].includes(state.tool)) {
       renderEditor();
       return;
   }
   const x = state.mouseX;
   const y = state.mouseY;
   if (x < 0 || x >= state.width || y < 0 || y >= state.height) return;
   const frameData = state.frames[state.currentFrameIndex];
   if (state.tool === 'picker') {
       const idx = (y * state.width + x) * 4;
       const r = frameData.data[idx];
       const g = frameData.data[idx+1];
       const b = frameData.data[idx+2];
       const a = frameData.data[idx+3];
       if(a > 0) {
           const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
           updateColor(hex);
           setTool('pen');
       }
       return;
   }
   const bigint = parseInt(state.color.slice(1), 16);
   const r = (bigint >> 16) & 255;
   const g = (bigint >> 8) & 255;
   const b = bigint & 255;
   for (let ix = 0; ix < state.brushSize; ix++) {
       for (let iy = 0; iy < state.brushSize; iy++) {
           const drawX = x - Math.floor(state.brushSize / 2) + ix;
           const drawY = y - Math.floor(state.brushSize / 2) + iy;
           const paintPixel = (px, py) => {
               if (px >= 0 && px < state.width && py >= 0 && py < state.height) {
                   const pixelKey = `${px},${py}`;
                   if((state.tool === 'lighten' || state.tool === 'darken') && state.paintedPixels.has(pixelKey)) {
                       return;
                   }
                   const idx = (py * state.width + px) * 4;
                   if (state.tool === 'pen') {
                       frameData.data[idx] = r;
                       frameData.data[idx+1] = g;
                       frameData.data[idx+2] = b;
                       frameData.data[idx+3] = 255;
                   } else if (state.tool === 'eraser') {
                       frameData.data[idx+3] = 0;
                   } else if (state.tool === 'lighten' || state.tool === 'darken') {
                       if (frameData.data[idx+3] > 0) {
                           const [h, s, l] = rgbToHsl(frameData.data[idx], frameData.data[idx+1], frameData.data[idx+2]);
                           let newR, newG, newB;
                           if (state.tool === 'lighten') {
                               const newL = Math.min(1, l + 0.1);
                               const newH = (h + 10) % 360;
                               [newR, newG, newB] = hslToRgb(newH, s, newL);
                           } else {
                               const newL = Math.max(0, l - 0.1);
                               const newS = Math.min(1, s + 0.1);
                               let newH = h - 10;
                               if(newH < 0) newH += 360;
                               [newR, newG, newB] = hslToRgb(newH, newS, newL);
                           }
                           frameData.data[idx] = newR;
                           frameData.data[idx+1] = newG;
                           frameData.data[idx+2] = newB;
                           state.paintedPixels.add(pixelKey);
                       }
                   }
               }
           };
           paintPixel(drawX, drawY);
           if (state.mirrorX) paintPixel(state.width - 1 - drawX, drawY);
           if (state.mirrorY) paintPixel(drawX, state.height - 1 - drawY);
           if (state.mirrorX && state.mirrorY) paintPixel(state.width - 1 - drawX, state.height - 1 - drawY);
       }
   }
   renderEditor();
}
function paintPoint(px, py, r, g, b, a) {
   const frameData = state.frames[state.currentFrameIndex];
   const offset = Math.floor(state.brushSize / 2);
   const setP = (tx, ty) => {
       if (tx >= 0 && tx < state.width && ty >= 0 && ty < state.height) {
           const idx = (ty * state.width + tx) * 4;
           if(a === 0) {
               frameData.data[idx+3] = 0;
           } else {
               frameData.data[idx] = r;
               frameData.data[idx+1] = g;
               frameData.data[idx+2] = b;
               frameData.data[idx+3] = 255;
           }
       }
   };
   for (let ix = 0; ix < state.brushSize; ix++) {
       for (let iy = 0; iy < state.brushSize; iy++) {
           const drawX = px - offset + ix;
           const drawY = py - offset + iy;
           setP(drawX, drawY);
           if (state.mirrorX) setP(state.width - 1 - drawX, drawY);
           if (state.mirrorY) setP(drawX, state.height - 1 - drawY);
           if (state.mirrorX && state.mirrorY) setP(state.width - 1 - drawX, state.height - 1 - drawY);
       }
   }
}
function floodFill(startX, startY, hexColor) {
   if (startX < 0 || startX >= state.width || startY < 0 || startY >= state.height) return;
   const frameData = state.frames[state.currentFrameIndex];
   const width = state.width;
   const height = state.height;
   const startIdx = (startY * width + startX) * 4;
   const startR = frameData.data[startIdx];
   const startG = frameData.data[startIdx+1];
   const startB = frameData.data[startIdx+2];
   const startA = frameData.data[startIdx+3];
   const bigint = parseInt(hexColor.slice(1), 16);
   const fillR = (bigint >> 16) & 255;
   const fillG = (bigint >> 8) & 255;
   const fillB = bigint & 255;
   const fillA = 255;
   if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;
   const stack = [[startX, startY]];
   while (stack.length) {
       const [x, y] = stack.pop();
       const idx = (y * width + x) * 4;
       if (frameData.data[idx] === startR &&
           frameData.data[idx+1] === startG &&
           frameData.data[idx+2] === startB &&
           frameData.data[idx+3] === startA) {
           frameData.data[idx] = fillR;
           frameData.data[idx+1] = fillG;
           frameData.data[idx+2] = fillB;
           frameData.data[idx+3] = fillA;
           if (x > 0) stack.push([x - 1, y]);
           if (x < width - 1) stack.push([x + 1, y]);
           if (y > 0) stack.push([x, y - 1]);
           if (y < height - 1) stack.push([x, y + 1]);
       }
   }
}
function renderEditor() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   // 1. Background
   ctx.fillStyle = '#ddd';
   for(let y=0; y<state.height; y++) {
       for(let x=0; x<state.width; x++) {
           if((x+y)%2 === 0) ctx.fillRect(x*state.scale, y*state.scale, state.scale, state.scale);
       }
   }
   // 2. Onion Skin
   if (state.showOnionSkin && state.currentFrameIndex > 0) {
       const prevFrame = state.frames[state.currentFrameIndex - 1];
       if (prevFrame) {
           const onionCanvas = document.createElement('canvas');
           onionCanvas.width = state.width;
           onionCanvas.height = state.height;
           onionCanvas.getContext('2d').putImageData(prevFrame, 0, 0);
           ctx.save();
           ctx.globalAlpha = 0.3;
           ctx.imageSmoothingEnabled = false;
           ctx.drawImage(onionCanvas, 0, 0, state.width * state.scale, state.height * state.scale);
           ctx.restore();
       }
   }
   // 3. Draw Current Frame
   const tempCanvas = document.createElement('canvas');
   tempCanvas.width = state.width;
   tempCanvas.height = state.height;
   const tempCtx = tempCanvas.getContext('2d');
   if (state.frames[state.currentFrameIndex]) {
       tempCtx.putImageData(state.frames[state.currentFrameIndex], 0, 0);
       ctx.imageSmoothingEnabled = false;
       ctx.drawImage(tempCanvas, 0, 0, state.width * state.scale, state.height * state.scale);
   }
   // 4. FLOATING SELECTION (Draw this ABOVE frame)
   if (state.selection.active && state.selection.buffer) {
       const floatCanvas = document.createElement('canvas');
       floatCanvas.width = state.selection.w;
       floatCanvas.height = state.selection.h;
       floatCanvas.getContext('2d').putImageData(state.selection.buffer, 0, 0);
       ctx.drawImage(
           floatCanvas,
           state.selection.x * state.scale,
           state.selection.y * state.scale,
           state.selection.w * state.scale,
           state.selection.h * state.scale
       );
   }
   // 5. Grid Lines
   if (state.showGrid) {
       ctx.strokeStyle = 'rgba(0,0,0,0.1)';
       ctx.lineWidth = 1;
       ctx.beginPath();
       for(let i=0; i<=state.width; i++) {
           ctx.moveTo(i*state.scale, 0);
           ctx.lineTo(i*state.scale, canvas.height);
       }
       for(let i=0; i<=state.height; i++) {
           ctx.moveTo(0, i*state.scale);
           ctx.lineTo(canvas.width, i*state.scale);
       }
       ctx.stroke();
   }
   // 6. SELECTION BOX (Marching Ants)
   if (state.tool === 'select' && (state.isDrawing || state.selection.active)) {
       let sx, sy, sw, sh;
       if (state.isDrawing) {
           sx = Math.min(state.startDragX, state.mouseX);
           sy = Math.min(state.startDragY, state.mouseY);
           sw = Math.abs(state.mouseX - state.startDragX) + 1;
           sh = Math.abs(state.mouseY - state.startDragY) + 1;
       } else {
           sx = state.selection.x;
           sy = state.selection.y;
           sw = state.selection.w;
           sh = state.selection.h;
       }
       ctx.save();
       ctx.strokeStyle = '#fff';
       ctx.lineWidth = 2;
       ctx.setLineDash([4, 4]);
       ctx.strokeRect(sx * state.scale, sy * state.scale, sw * state.scale, sh * state.scale);
       ctx.strokeStyle = '#000';
       ctx.lineDashOffset = 4;
       ctx.strokeRect(sx * state.scale, sy * state.scale, sw * state.scale, sh * state.scale);
       ctx.restore();
   }
   // 7. CROSSHAIR (For Select Tool when not dragging)
   if (state.tool === 'select' && !state.isDrawing && !state.selection.isDragging && state.mouseX >= 0 && state.mouseY >= 0) {
           const mx = state.mouseX * state.scale + state.scale/2;
           const my = state.mouseY * state.scale + state.scale/2;
           // Crosshair Lines
           ctx.save();
           ctx.beginPath();
           ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
           ctx.lineWidth = 1;
           ctx.moveTo(mx, 0); ctx.lineTo(mx, canvas.height);
           ctx.moveTo(0, my); ctx.lineTo(canvas.width, my);
           ctx.stroke();
           // Cursor Box
           ctx.strokeStyle = '#fff';
           ctx.lineWidth = 2;
           const boxSize = state.scale;
           ctx.strokeRect(state.mouseX * state.scale, state.mouseY * state.scale, boxSize, boxSize);
           ctx.restore();
   }
   // 8. Cursor & Shape Preview
   if (state.mouseX >= 0 && state.mouseY >= 0 && state.tool !== 'select') {
       const drawVisuals = (mx, my, isStart, tx, ty) => {
           const offset = Math.floor(state.brushSize / 2);
           if (state.isDrawing && ['line', 'rect', 'circle'].includes(state.tool)) {
               ctx.beginPath();
               ctx.strokeStyle = "rgba(0,0,0,0.5)";
               ctx.lineWidth = (state.brushSize * state.scale) + 2;
               ctx.lineCap = "square";
               const x0 = (isStart ? mx : tx) * state.scale + state.scale/2;
               const y0 = (isStart ? my : ty) * state.scale + state.scale/2;
               const x1 = mx * state.scale + state.scale/2;
               const y1 = my * state.scale + state.scale/2;
               const traceShape = () => {
                   if (state.tool === 'line') {
                       ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
                   } else if (state.tool === 'rect') {
                       ctx.rect(x0, y0, x1 - x0, y1 - y0);
                   } else if (state.tool === 'circle') {
                           const cx = (x0 + x1) / 2;
                           const cy = (y0 + y1) / 2;
                           const rx = Math.abs(x1 - x0) / 2;
                           const ry = Math.abs(y1 - y0) / 2;
                           ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                   }
               };
               traceShape();
               ctx.stroke();
               ctx.beginPath();
               ctx.strokeStyle = state.color;
               ctx.lineWidth = state.brushSize * state.scale;
               traceShape();
               ctx.stroke();
           }
           if (!state.isDrawing || ['pen', 'eraser', 'lighten', 'darken', 'picker', 'bucket'].includes(state.tool)) {
               const drawX = (mx - offset) * state.scale;
               const drawY = (my - offset) * state.scale;
               const drawSize = state.brushSize * state.scale;
               if (['pen', 'bucket', 'rect', 'circle', 'line'].includes(state.tool)) {
                   ctx.fillStyle = state.color;
                   ctx.globalAlpha = 0.3;
                   ctx.fillRect(drawX, drawY, drawSize, drawSize);
                   ctx.globalAlpha = 1.0;
               }
               const drawCrispBox = (colorOuter, colorInner) => {
                   ctx.lineWidth = 3;
                   ctx.strokeStyle = colorOuter;
                   ctx.strokeRect(drawX, drawY, drawSize, drawSize);
                   ctx.lineWidth = 1;
                   ctx.strokeStyle = colorInner;
                   ctx.strokeRect(drawX, drawY, drawSize, drawSize);
               };
               if (state.tool === 'eraser') {
                   drawCrispBox('#ffffff', '#ff0000');
                   ctx.beginPath();
                   ctx.strokeStyle = '#ff0000';
                   ctx.moveTo(drawX, drawY); ctx.lineTo(drawX + drawSize, drawY + drawSize);
                   ctx.moveTo(drawX + drawSize, drawY); ctx.lineTo(drawX, drawY + drawSize);
                   ctx.stroke();
               } else if (state.tool === 'picker') {
                   drawCrispBox('#000000', '#ffffff');
                   ctx.beginPath();
                   ctx.strokeStyle = '#ffffff';
                   ctx.lineWidth = 2;
                   ctx.moveTo(drawX + drawSize/2, drawY + drawSize/2 - 5);
                   ctx.lineTo(drawX + drawSize/2, drawY + drawSize/2 + 5);
                   ctx.moveTo(drawX + drawSize/2 - 5, drawY + drawSize/2);
                   ctx.lineTo(drawX + drawSize/2 + 5, drawY + drawSize/2);
                   ctx.stroke();
               } else if (state.tool === 'lighten') {
                   drawCrispBox('#000000', '#ffff00');
               } else if (state.tool === 'darken') {
                   drawCrispBox('#ffffff', '#0000aa');
               } else {
                   drawCrispBox('rgba(0,0,0,0.8)', '#ffffff');
               }
           }
       };
       const mx = state.mouseX;
       const my = state.mouseY;
       const sx = state.startDragX;
       const sy = state.startDragY;
       drawVisuals(mx, my, false, sx, sy);
       const originalAlpha = ctx.globalAlpha;
       ctx.globalAlpha = 0.6;
       if (state.mirrorX) drawVisuals(state.width - 1 - mx, my, false, state.width - 1 - sx, sy);
       if (state.mirrorY) drawVisuals(mx, state.height - 1 - my, false, sx, state.height - 1 - sy);
       if (state.mirrorX && state.mirrorY) drawVisuals(state.width - 1 - mx, state.height - 1 - my, false, state.width - 1 - sx, state.height - 1 - sy);
       ctx.globalAlpha = originalAlpha;
   }
}