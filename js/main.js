/* js/main.js */

function init() {

    if (!loadState()) {

        resizeCanvas();

        addFrame(); 

    } else {

        resizeCanvas();

        renderFrameList();

    }

    renderPalette(); 

    startAnimationLoop();

    // --- EVENTS ---

    canvas.addEventListener('mousedown', startDraw);

    window.addEventListener('mouseup', endDraw); 

    canvas.addEventListener('mousemove', (e) => { trackMouse(e); draw(e); });

    canvas.addEventListener('mouseleave', () => { state.mouseX = -1; renderEditor(); });

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); trackTouch(e); startDraw(e); }, {passive: false});

    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); trackTouch(e); draw(e); }, {passive: false});

    canvas.addEventListener('touchend', (e) => { e.preventDefault(); endDraw(); });

    window.addEventListener('keydown', handleShortcuts);

    window.addEventListener('paste', handlePaste);

    document.getElementById('fps-slider').addEventListener('input', (e) => {

        state.fps = parseInt(e.target.value);

        document.getElementById('fps-display').innerText = state.fps;

        saveState();

    });

    document.getElementById('btn-play').addEventListener('click', () => {

            state.isPlaying = !state.isPlaying;

    });

    document.getElementById('brush-slider').addEventListener('input', (e) => {

        state.brushSize = parseInt(e.target.value);

        document.getElementById('brush-display').innerText = state.brushSize;

    });

    colorInput.addEventListener('input', (e) => updateColor(e.target.value));

    hexInput.addEventListener('input', (e) => {

        const val = e.target.value;

        const validHex = parseColorString(val);

        if (validHex) updateColor(validHex);

    });

    setupDragSource();

    updateColor('#000000');

}

// --- TOOLS & UI HELPERS ---

function toggleGrid() {

    state.showGrid = !state.showGrid;

    const btn = document.getElementById('btn-grid');

    state.showGrid ? btn.classList.add('active') : btn.classList.remove('active');

    renderEditor();

}

function toggleOnion() {

    state.showOnionSkin = !state.showOnionSkin;

    const btn = document.getElementById('btn-onion');

    state.showOnionSkin ? btn.classList.add('active') : btn.classList.remove('active');

    renderEditor();

}

function toggleMirrorX() {

    state.mirrorX = !state.mirrorX;

    const btn = document.getElementById('btn-mirror-x');

    state.mirrorX ? btn.classList.add('active') : btn.classList.remove('active');

    renderEditor();

}

function toggleMirrorY() {

    state.mirrorY = !state.mirrorY;

    const btn = document.getElementById('btn-mirror-y');

    state.mirrorY ? btn.classList.add('active') : btn.classList.remove('active');

    renderEditor();

}

function startDraw(e) {

    if (e.type === 'mousedown' && e.button !== 0) return; 

    // Handle Select Tool

    if (state.tool === 'select') {

        // SINGLE PIXEL ADDITIVE SELECTION (Ctrl + Click)

        if (e.ctrlKey) {

            addPixelToSelection(state.mouseX, state.mouseY);

            return;

        }

        // If clicking OUTSIDE selection, anchor current and start new

        if (state.selection.active && !isMouseInSelection(state.mouseX, state.mouseY)) {

            anchorSelection();

        }

        // If clicking INSIDE selection, start drag

        if (state.selection.active && isMouseInSelection(state.mouseX, state.mouseY)) {

            liftSelection(); // Ensure it's floating

            state.selection.isDragging = true;

            state.selection.originX = state.mouseX - state.selection.x;

            state.selection.originY = state.mouseY - state.selection.y;

            return;

        }

        // Start New Selection

        state.startDragX = state.mouseX;

        state.startDragY = state.mouseY;

        state.isDrawing = true;

        return;

    }

    // Anchor selection if drawing with another tool

    if (state.selection.active) anchorSelection();

    state.startDragX = state.mouseX;

    state.startDragY = state.mouseY;

    state.paintedPixels.clear(); 

    if (state.tool === 'bucket') {

        const x = state.mouseX;

        const y = state.mouseY;

        floodFill(x, y, state.color);

        if (state.mirrorX) floodFill(state.width - 1 - x, y, state.color);

        if (state.mirrorY) floodFill(x, state.height - 1 - y, state.color);

        if (state.mirrorX && state.mirrorY) floodFill(state.width - 1 - x, state.height - 1 - y, state.color);

        commitToHistory();

        renderEditor();

        updateFrameThumb(state.currentFrameIndex);

        saveState(); 

        return;

    }

    state.isDrawing = true;

    draw(e);

}

function endDraw() {

    // Handle Select Tool

    if (state.tool === 'select') {

        if (state.selection.isDragging) {

            state.selection.isDragging = false;

        } else if (state.isDrawing) {

            // Finalize selection box

            let x = Math.min(state.startDragX, state.mouseX);

            let y = Math.min(state.startDragY, state.mouseY);

            let w = Math.abs(state.mouseX - state.startDragX) + 1;

            let h = Math.abs(state.mouseY - state.startDragY) + 1;

            // Clamp to canvas

            x = Math.max(0, x); y = Math.max(0, y);

            w = Math.min(state.width - x, w);

            h = Math.min(state.height - y, h);

            if (w > 0 && h > 0) {

                state.selection = {

                    active: true,

                    x: x, y: y, w: w, h: h,

                    buffer: null,

                    isDragging: false,

                    originX: 0, originY: 0

                };

            }

            state.isDrawing = false;

        }

        renderEditor();

        return;

    }

    if (state.isDrawing) {

        if (state.tool === 'line') {

            applyLine(state.startDragX, state.startDragY, state.mouseX, state.mouseY);

        } else if (state.tool === 'rect') {

            applyRect(state.startDragX, state.startDragY, state.mouseX, state.mouseY);

        } else if (state.tool === 'circle') {

            applyEllipse(state.startDragX, state.startDragY, state.mouseX, state.mouseY);

        }

        state.isDrawing = false;

        state.paintedPixels.clear();

        updateFrameThumb(state.currentFrameIndex);

        commitToHistory(); 

        saveState(); 

    }

}

function applyLine(x0, y0, x1, y1) {

    const points = getLinePoints(x0, y0, x1, y1);

    const bigint = parseInt(state.color.slice(1), 16);

    const r = (bigint >> 16) & 255;

    const g = (bigint >> 8) & 255;

    const b = bigint & 255;

    points.forEach(([px, py]) => paintPoint(px, py, r, g, b, 255));

}

function applyRect(x0, y0, x1, y1) {

    applyLine(x0, y0, x1, y0); 

    applyLine(x0, y1, x1, y1); 

    applyLine(x0, y0, x0, y1); 

    applyLine(x1, y0, x1, y1); 

}

function applyEllipse(x0, y0, x1, y1) {

    const bigint = parseInt(state.color.slice(1), 16);

    const r = (bigint >> 16) & 255;

    const g = (bigint >> 8) & 255;

    const b = bigint & 255;

    const cx = (x0 + x1) / 2;

    const cy = (y0 + y1) / 2;

    const rx = Math.abs(x1 - x0) / 2;

    const ry = Math.abs(y1 - y0) / 2;

    const circum = 2 * Math.PI * Math.sqrt((rx*rx + ry*ry) / 2);

    const step = 1 / (circum * 1.5); 

    for (let t = 0; t <= 2 * Math.PI; t += step) {

        const px = Math.round(cx + rx * Math.cos(t));

        const py = Math.round(cy + ry * Math.sin(t));

        paintPoint(px, py, r, g, b, 255);

    }

}

function trackMouse(e) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;

    const scaleY = canvas.height / rect.height;

    const rawX = (e.clientX - rect.left) * scaleX;

    const rawY = (e.clientY - rect.top) * scaleY;

    state.mouseX = Math.floor(rawX / state.scale);

    state.mouseY = Math.floor(rawY / state.scale);

    // Cursor Styling

    if (state.tool === 'select' && isMouseInSelection(state.mouseX, state.mouseY)) {

        canvas.style.cursor = 'move';

    } else {

        canvas.style.cursor = 'none';

    }

    renderEditor(); 

}

function trackTouch(e) {

    const rect = canvas.getBoundingClientRect();

    const touch = e.touches[0];

    if(!touch) return;

    const scaleX = canvas.width / rect.width;

    const scaleY = canvas.height / rect.height;

    const rawX = (touch.clientX - rect.left) * scaleX;

    const rawY = (touch.clientY - rect.top) * scaleY;

    state.mouseX = Math.floor(rawX / state.scale);

    state.mouseY = Math.floor(rawY / state.scale);

}

function undo() {

    if (state.historyIndex > 0) {

        state.historyIndex--;

        restoreFromHistory();

        saveState(); 

    }

}

function redo() {

    if (state.historyIndex < state.history.length - 1) {

        state.historyIndex++;

        restoreFromHistory();

        saveState(); 

    }

}

function restoreFromHistory() {

    const hist = state.history[state.historyIndex];

    if (hist.frameIndex !== state.currentFrameIndex) {

        state.currentFrameIndex = hist.frameIndex;

        renderFrameList();

    }

    state.frames[state.currentFrameIndex] = new ImageData(

        new Uint8ClampedArray(hist.data.data),

        hist.data.width,

        hist.data.height

    );

    state.selection.active = false;

    state.selection.buffer = null;

    renderEditor();

    updateFrameThumb(state.currentFrameIndex);

}

function commitToHistory() {

    if (state.historyIndex < state.history.length - 1) {

        state.history = state.history.slice(0, state.historyIndex + 1);

    }

    if (state.history.length > 50) {

        state.history.shift();

        state.historyIndex--;

    }

    const currentData = state.frames[state.currentFrameIndex];

    const copy = new ImageData(

        new Uint8ClampedArray(currentData.data),

        currentData.width,

        currentData.height

    );

    state.history.push({

        frameIndex: state.currentFrameIndex,

        data: copy

    });

    state.historyIndex++;

}

function handleShortcuts(e) {

    if (e.target.tagName === 'INPUT') return;

    // Arrow Keys for Moving Selection

    if (state.selection.active && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {

        e.preventDefault();

        if (e.key === 'ArrowUp') state.selection.y--;

        if (e.key === 'ArrowDown') state.selection.y++;

        if (e.key === 'ArrowLeft') state.selection.x--;

        if (e.key === 'ArrowRight') state.selection.x++;

        renderEditor();

        return;

    }

    // Copy / Cut / Paste

    if (e.ctrlKey) {

        if (e.key.toLowerCase() === 'c') {

            e.preventDefault();

            state.clipboard = captureSelection();

            return;

        }

        if (e.key.toLowerCase() === 'x') {

            e.preventDefault();

            state.clipboard = captureSelection();

            eraseUnderSelection();

            state.selection.active = false; 

            state.selection.buffer = null;

            commitToHistory();

            renderEditor();

            return;

        }

        if (e.key.toLowerCase() === 'v') {

            e.preventDefault();

            if (state.clipboard) {

                setTool('select'); 

                anchorSelection(); 

                state.selection.buffer = new ImageData(

                    new Uint8ClampedArray(state.clipboard.data),

                    state.clipboard.width,

                    state.clipboard.height

                );

                state.selection.w = state.clipboard.width;

                state.selection.h = state.clipboard.height;

                state.selection.x = Math.floor((state.width - state.selection.w)/2);

                state.selection.y = Math.floor((state.height - state.selection.h)/2);

                state.selection.active = true;

                renderEditor();

            }

            return;

        }

        if (e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }

        if (e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }

    }

    if (!e.ctrlKey) {

        switch(e.key.toLowerCase()) {

            case 's': setTool('select'); break;

            case 'p': setTool('pen'); break;

            case 'e': setTool('eraser'); break;

            case 'i': setTool('picker'); break;

            case 'b': setTool('bucket'); break;

            case 'l': setTool('line'); break;

            case 'r': setTool('rect'); break;

            case 'c': setTool('circle'); break;

            case 'u': setTool('lighten'); break; 

            case 'd': setTool('darken'); break; 

            case 'g': toggleGrid(); break;

            case 'o': toggleOnion(); break;

            case 'm': toggleMirrorX(); break; 

            case 'n': toggleMirrorY(); break; 

            case 'delete': deleteSelection(); break;

            case ' ': e.preventDefault(); state.isPlaying = !state.isPlaying; break;

        }

    }

}

function setupDragSource() {

    dragSource.addEventListener('dragstart', (e) => {

        e.dataTransfer.setData('type', 'current');

        e.dataTransfer.setData('color', state.color);

    });

}

function renderPalette() {

    const container = document.getElementById('palette-container');

    container.innerHTML = '';

    state.palette.forEach((color, idx) => {

        const div = document.createElement('div');

        div.className = 'swatch';

        div.style.backgroundColor = color;

        div.draggable = true;

        div.title = "Left Click: Select | Right Click: Delete";

        div.onclick = () => { updateColor(color); setTool('pen'); };

        div.oncontextmenu = (e) => {

            e.preventDefault();

            if(state.palette.length > 1) {

                state.palette.splice(idx, 1);

                renderPalette();

                saveState(); 

            }

        };

        div.addEventListener('dragstart', (e) => {

            e.dataTransfer.setData('type', 'swatch');

            e.dataTransfer.setData('index', idx);

        });

        div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drag-over'); });

        div.addEventListener('dragleave', () => div.classList.remove('drag-over'));

        div.addEventListener('drop', (e) => {

            e.preventDefault(); div.classList.remove('drag-over');

            const type = e.dataTransfer.getData('type');

            if (type === 'current') {

                state.palette[idx] = e.dataTransfer.getData('color');

            } else if (type === 'swatch') {

                const fromIndex = parseInt(e.dataTransfer.getData('index'));

                const movedColor = state.palette[fromIndex];

                state.palette.splice(fromIndex, 1);

                state.palette.splice(idx, 0, movedColor);

            }

            renderPalette();

            saveState(); 

        });

        container.appendChild(div);

    });

    const addBtn = document.createElement('div');

    addBtn.className = 'btn-add-color';

    addBtn.innerHTML = '+';

    addBtn.onclick = addColorSlot;

    container.appendChild(addBtn);

}

function addColorSlot() {

    state.palette.push('#ffffff'); 

    renderPalette();

    const container = document.getElementById('palette-container');

    setTimeout(() => container.scrollTop = container.scrollHeight, 10);

    saveState(); 

}

function updateColor(hex) {

    state.color = hex;

    if(document.activeElement !== hexInput) hexInput.value = hex;

    colorInput.value = hex;

    dragSource.style.backgroundColor = hex;

}

function handleFileUpload(input) {

    if (input.files && input.files[0]) {

        const reader = new FileReader();

        reader.onload = (e) => importImageToCanvas(e.target.result);

        reader.readAsDataURL(input.files[0]);

    }

    input.value = ''; 

}

function handlePaste(e) {

    if (e.target.tagName === 'INPUT') return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    for (let index in items) {

        const item = items[index];

        if (item.kind === 'file' && item.type.includes('image/')) {

            const blob = item.getAsFile();

            const reader = new FileReader();

            reader.onload = (event) => importImageToCanvas(event.target.result);

            reader.readAsDataURL(blob);

            const overlay = document.getElementById('paste-overlay');

            overlay.style.display = 'flex';

            setTimeout(() => overlay.style.display = 'none', 1000);

        }

    }

}

function importImageToCanvas(sourceUrl) {

    const img = new Image();

    img.onload = () => {

        const tempCvs = document.createElement('canvas');

        tempCvs.width = state.width; tempCvs.height = state.height;

        const tempCtx = tempCvs.getContext('2d');

        tempCtx.imageSmoothingEnabled = false; 

        tempCtx.drawImage(img, 0, 0, state.width, state.height);

        const newData = tempCtx.getImageData(0, 0, state.width, state.height);

        for (let i = 0; i < newData.data.length; i += 4) {

            if (newData.data[i] > 250 && newData.data[i+1] > 250 && newData.data[i+2] > 250) newData.data[i+3] = 0;

        }

        state.frames[state.currentFrameIndex] = newData;

        commitToHistory(); 

        renderEditor();

        updateFrameThumb(state.currentFrameIndex);

        saveState(); 

    };

    img.src = sourceUrl;

}

function resizeGrid() {

    const newSize = parseInt(document.getElementById('size-input').value);

    if(newSize < 8 || newSize > 64) return alert('Size must be between 8 and 64');

    if(!confirm("Changing size will clear current work and auto-save. Continue?")) return;

    state.width = newSize; state.height = newSize;

    state.frames = []; state.currentFrameIndex = 0; state.history = []; state.historyIndex = -1;

    resizeCanvas(); 

    addFrame(); 

    saveState(); 

}

function resizeCanvas() {

    canvas.width = state.width * state.scale;

    canvas.height = state.height * state.scale;

    previewCanvas.width = state.width * state.previewScale;

    previewCanvas.height = state.height * state.previewScale;

    previewCtx.imageSmoothingEnabled = false;

    renderEditor();

}

function clearCanvas() {

    const empty = new ImageData(state.width, state.height);

    state.frames[state.currentFrameIndex] = empty;

    commitToHistory();

    renderEditor();

    updateFrameThumb(state.currentFrameIndex);

    saveState(); 

}

function addFrame() {

    const empty = new ImageData(state.width, state.height);

    state.frames.push(empty);

    state.currentFrameIndex = state.frames.length - 1;

    commitToHistory(); 

    renderFrameList();

    renderEditor();

    saveState(); 

}

function duplicateFrame() {

    const current = state.frames[state.currentFrameIndex];

    const copy = new ImageData(new Uint8ClampedArray(current.data), state.width, state.height);

    state.frames.push(copy);

    state.currentFrameIndex = state.frames.length - 1;

    commitToHistory();

    renderFrameList();

    renderEditor();

    saveState(); 

}

function deleteFrame() {

    if(state.frames.length <= 1) return alert("Cannot delete the last frame.");

    state.frames.splice(state.currentFrameIndex, 1);

    if(state.currentFrameIndex >= state.frames.length) state.currentFrameIndex--;

    commitToHistory();

    renderFrameList();

    renderEditor();

    saveState(); 

}

function renderFrameList() {

    frameList.innerHTML = '';

    state.frames.forEach((frame, idx) => {

        const cvs = document.createElement('canvas');

        cvs.width = state.width; cvs.height = state.height;

        cvs.className = `frame-thumb ${idx === state.currentFrameIndex ? 'selected' : ''}`;

        const c = cvs.getContext('2d');

        c.putImageData(frame, 0, 0);

        cvs.title = `Frame ${idx + 1}`;

        cvs.onclick = () => {

            state.currentFrameIndex = idx;

            renderFrameList();

            renderEditor();

        };

        frameList.appendChild(cvs);

    });

}

function updateFrameThumb(idx) {

    if(frameList.children[idx]) {

        const ctx = frameList.children[idx].getContext('2d');

        ctx.clearRect(0,0,state.width, state.height);

        ctx.putImageData(state.frames[idx], 0, 0);

    }

}

let lastTime = 0; let animFrameIndex = 0;

function startAnimationLoop() {

    function animate(timestamp) {

        if (state.isPlaying && state.frames.length > 0) {

            const interval = 1000 / state.fps;

            if (timestamp - lastTime > interval) {

                lastTime = timestamp;

                animFrameIndex = (animFrameIndex + 1) % state.frames.length;

                previewCtx.clearRect(0,0,previewCanvas.width, previewCanvas.height);

                const tCvs = document.createElement('canvas');

                tCvs.width = state.width; tCvs.height = state.height;

                const tCtx = tCvs.getContext('2d');

                tCtx.putImageData(state.frames[animFrameIndex], 0, 0);

                previewCtx.drawImage(tCvs, 0, 0, previewCanvas.width, previewCanvas.height);

            }

        }

        requestAnimationFrame(animate);

    }

    requestAnimationFrame(animate);

}

function setTool(name) {

    anchorSelection(); // Commit any selection before changing tools

    state.tool = name;

    document.querySelectorAll('.tool-group button').forEach(b => b.classList.remove('active'));

    if(name === 'select') document.getElementById('btn-select').classList.add('active');

    if(name === 'pen') document.getElementById('btn-pen').classList.add('active');

    if(name === 'eraser') document.getElementById('btn-eraser').classList.add('active');

    if(name === 'picker') document.getElementById('btn-picker').classList.add('active');

    if(name === 'bucket') document.getElementById('btn-bucket').classList.add('active');

    if(name === 'line') document.getElementById('btn-line').classList.add('active');

    if(name === 'rect') document.getElementById('btn-rect').classList.add('active');

    if(name === 'circle') document.getElementById('btn-circle').classList.add('active');

    if(name === 'lighten') document.getElementById('btn-lighten').classList.add('active');

    if(name === 'darken') document.getElementById('btn-darken').classList.add('active');

    renderEditor(); 

}

function exportImage() {

    const tempCanvas = document.createElement('canvas');

    tempCanvas.width = state.width; tempCanvas.height = state.height;

    tempCanvas.getContext('2d').putImageData(state.frames[state.currentFrameIndex], 0, 0);

    const link = document.createElement('a');

    link.download = 'sprite.png'; link.href = tempCanvas.toDataURL(); link.click();

}

function exportSpriteSheet() {

    const sheet = document.createElement('canvas');

    sheet.width = state.width * state.frames.length; sheet.height = state.height;

    const ctx = sheet.getContext('2d');

    state.frames.forEach((frame, i) => {

        const temp = document.createElement('canvas');

        temp.width = state.width; temp.height = state.height;

        temp.getContext('2d').putImageData(frame, 0, 0);

        ctx.drawImage(temp, i * state.width, 0);

    });

    const link = document.createElement('a');

    link.download = 'spritesheet.png'; link.href = sheet.toDataURL(); link.click();

}

// Start the app!

init();
 