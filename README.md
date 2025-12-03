# 🎨 Kelvin's Sprite Creator

**Internal Tool for Project: Restaurhunt**

## 📖 Overview
**Kelvin's Sprite Creator** is a lightweight, browser-based pixel art editor built specifically to accelerate the asset creation pipeline for the game **Restaurhunt**.

This tool allows for rapid prototyping of monsters, food items, and UI elements. It features a streamlined workflow for importing reference images, editing pixel-perfect animations, and exporting sprite sheets ready for game engines (Unity/Godot).

## ✨ Key Features

### 🛠️ Drawing Tools
* **Pro Tools:** Pen, Eraser, and Color Picker.
* **Brush Sizing:** Adjustable brush sizes (1px to 8px) for quick filling or detailing.
* **Smart Cursor:** Ghost cursor shows exactly where pixels will be placed.
* **History:** Full Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) support.

### 🎬 Animation System
* **Frame Management:** Add, Duplicate, and Delete frames.
* **Live Preview:** Real-time animation playback with adjustable FPS (1-24).
* **Onion Skinning:** (Implicit via frame toggling).

### 🎨 Color Management
* **Smart Palette:** Drag-and-drop colors to reorder them.
* **Hex/RGB Input:** Paste colors directly from external design tools.
* **Save Colors:** Drag the "Current Color" box into a palette slot to save it for later.
* **Generate Hex Colours:** https://kelvinchow2003.github.io/Pallete-Pilot/ 

### 🌐 Import & Reference
* **Google Search Integration:** One-click search for reference sprites.
* **Clipboard Support:** Copy any image from the web and press **Ctrl+V** to paste it directly onto the canvas. The tool automatically pixelates and downscales the image to fit your grid.

## 🚀 Getting Started

1.  **Download:** Save the `sprite-creator.html` file to your computer.
2.  **Run:** Double-click the file to open it in your default web browser (Chrome, Edge, Firefox, etc.).
3.  **No Install Needed:** This tool runs entirely locally. No server or internet connection is required (except for the Search feature).

## 🎮 Workflow for Restaurhunt

1.  **Set Grid Size:** Use the sidebar to set your target size (e.g., `32px` for items, `64px` for bosses).
2.  **Reference:** Click "Find Sprites Online" to find a base image, copy it, and paste it into the editor.
3.  **Edit:** Use the Pen tool to clean up the sprite and match the game's color palette.
4.  **Animate:** Duplicate the frame and make slight adjustments to create an idle or attack animation.
5.  **Export:** Click **"🎞️ Sheet"** to download the sprite sheet.
6.  **Import to Engine:** Drag the `.png` sprite sheet into your Unity/Game Project assets folder.

## ⌨️ Shortcuts

| Key Combination | Action |
| :--- | :--- |
| **P** | Select Pen Tool |
| **E** | Select Eraser Tool |
| **I** | Select Color Picker |
| **Ctrl + Z** | Undo |
| **Ctrl + Y** | Redo |
| **Ctrl + V** | Paste Image from Clipboard |

## 📜 License
Property of Kelvin. Created for the development of *Restaurhunt*.