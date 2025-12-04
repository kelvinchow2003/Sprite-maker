# 🎨 Kelvin's Sprite Creator
**Internal Tool for Project: Restaurhunt**
## 📖 Overview
**Kelvin's Sprite Creator** is a lightweight, browser-based pixel art editor built specifically to accelerate the asset creation pipeline for the game **Restaurhunt**.
This tool allows for rapid prototyping of monsters, food items, and UI elements. It features a streamlined workflow for importing reference images, editing pixel-perfect animations, complex selection manipulation, and exporting sprite sheets ready for game engines (Unity/Godot).
## ✨ Key Features
### 🛠️ Drawing & Shape Tools
* **Pro Tools:** Pen (`P`), Eraser (`E`), Color Picker (`I`), and Bucket Fill (`B`).
* **Shape Primitives:** Quickly draw Lines (`L`), Hollow Rectangles (`R`), and Circles/Ellipses (`C`).
* **Shading Modifiers:** Dedicated Lighten (`U`) and Darken (`D`) tools to quickly highlight or shade pixels without changing the palette manually.
* **High-Contrast Cursor:** A smart double-outline cursor ensures visibility on any background color, with specific icons for Eraser and Picker tools.
### ✂️ Advanced Selection & Manipulation
* **Marquee Selection:** Use the Select Tool (`S`) to define a rectangular zone.
* **Magic Wand (Additive):** Hold **Ctrl + Click** while using the Select tool to pick individual pixels or add non-adjacent pixels to your current selection group.
* **Floating Selections:** Selected pixels are "lifted" from the canvas. You can drag them freely without destroying the pixels underneath until you deselect.
* **Precision Nudging:** Use **Arrow Keys** to move selected pixels by 1px for perfect alignment.
* **Full Clipboard Support:** Cut (`Ctrl+X`), Copy (`Ctrl+C`), and Paste (`Ctrl+V`). Pasted items float in the center of the screen, ready to be moved.
### 🎬 Animation System
* **Frame Management:** Add, Duplicate, and Delete frames.
* **Live Preview:** Real-time animation playback with adjustable FPS (1-24).
* **Onion Skinning:** Toggle `O` to see a ghostly overlay of the previous frame for smooth animation tracking.
### 🎨 Color Management
* **Smart Palette:** Drag-and-drop colors to reorder them.
* **Hex/RGB Input:** Paste colors directly from external design tools.
* **Save Colors:** Drag the "Current Color" box into a palette slot to save it for later.
* **Generate Hex Colours:** https://kelvinchow2003.github.io/Pallete-Pilot/
### 🌐 Import & Reference
* **Google Search Integration:** One-click search for reference sprites.
* **Clipboard Support:** Copy any image from the web and press **Ctrl+V** to paste it directly onto the canvas. The tool automatically pixelates and downscales the image to fit your grid.
## 🚀 Getting Started
1.  **Download:** Save the `index.html` file to your computer.
2.  **Run:** Double-click the file to open it in your default web browser (Chrome, Edge, Firefox, etc.).
3.  **No Install Needed:** This tool runs entirely locally. No server or internet connection is required (except for the Search feature).
## 🎮 Workflow for Restaurhunt
1.  **Set Grid Size:** Use the sidebar to set your target size (e.g., `32px` for items, `64px` for bosses).
2.  **Reference:** Click "Find Sprites Online" to find a base image, copy it, and paste it into the editor.
3.  **Edit:** Use the Pen tool to clean up the sprite. Use **Ctrl+Click (Wand)** to grab specific parts of the imported image and separate them.
4.  **Shade:** Use the Lighten/Darken tools to add depth to the food items/monsters.
5.  **Animate:** Duplicate the frame and use the **Select Tool** to slightly rotate or nudge limbs for idle/attack animations.
6.  **Export:** Click **"🎞️ Sheet"** to download the sprite sheet.
7.  **Import to Engine:** Drag the `.png` sprite sheet into your Unity/Game Project assets folder.
## ⌨️ Shortcuts
| Key Combination | Action |
| :--- | :--- |
| **P** | Pen Tool |
| **E** | Eraser Tool |
| **S** | Select Tool (Move/Transform) |
| **I** | Color Picker |
| **B** | Bucket Fill |
| **L / R / C** | Line / Rectangle / Circle Tools |
| **U / D** | Lighten / Darken Tools |
| **Ctrl + Left Click** | Add pixel to Selection (Magic Wand) |
| **Arrow Keys** | Nudge Selection (1px) |
| **Ctrl + Z / Y** | Undo / Redo |
| **Ctrl + X / C / V** | Cut / Copy / Paste |
| **G** | Toggle Grid |
| **O** | Toggle Onion Skin |
## 📜 License
Property of Kelvin. Created for the development of *Restaurhunt*.
