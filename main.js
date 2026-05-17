/**
 * Building Blocks - Main Workspace Script
 * Handles block creation, customization, drag-and-drop mechanics, and state management.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('canvas');
    const canvasPlaceholder = document.getElementById('canvas-placeholder');
    const addBlockBtn = document.getElementById('add-block-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const blockCountEl = document.getElementById('block-count');
    
    // Controls
    const blockColorInput = document.getElementById('block-color');
    const colorValueLabel = document.querySelector('.color-value');
    const blockSizeInput = document.getElementById('block-size');
    const blockShapeInput = document.getElementById('block-shape');

    // App State
    let blocks = [];
    let activeDragBlock = null;
    let dragOffset = { x: 0, y: 0 };

    // Sync Color Input Label
    blockColorInput.addEventListener('input', (e) => {
        colorValueLabel.textContent = e.target.value.toUpperCase();
    });

    /**
     * Updates the UI state of the canvas (placeholder & counter)
     */
    function updateCanvasState() {
        blockCountEl.textContent = blocks.length;
        if (blocks.length > 0) {
            canvasPlaceholder.style.display = 'none';
        } else {
            canvasPlaceholder.style.display = 'flex';
        }
    }

    /**
     * Spawns a new block with current control configurations
     */
    function createBlock(config = null) {
        const id = config?.id || `block-${Date.now()}`;
        const color = config?.color || blockColorInput.value;
        const size = config?.size || blockSizeInput.value;
        const shape = config?.shape || blockShapeInput.value;
        
        // Random position in center-ish area if not loaded
        let x = config?.x;
        let y = config?.y;
        
        if (x === undefined || y === undefined) {
            const canvasRect = canvas.getBoundingClientRect();
            // Offset a bit based on size
            const sizePx = size === 'small' ? 60 : size === 'medium' ? 90 : 130;
            x = Math.max(20, Math.floor(Math.random() * (canvasRect.width - sizePx - 40)) + 20);
            y = Math.max(20, Math.floor(Math.random() * (canvasRect.height - sizePx - 40)) + 20);
        }

        // Create Element
        const blockEl = document.createElement('div');
        blockEl.className = `block size-${size} shape-${shape}`;
        blockEl.id = id;
        blockEl.style.backgroundColor = color;
        blockEl.style.left = `${x}px`;
        blockEl.style.top = `${y}px`;
        
        // Glow effect matching block color
        blockEl.style.boxShadow = `
            0 10px 25px -5px rgba(0, 0, 0, 0.4),
            0 8px 10px -6px rgba(0, 0, 0, 0.4),
            0 0 15px ${color}44
        `;

        // Inner 3D Glass overlay
        const overlay = document.createElement('div');
        overlay.className = 'block-overlay';
        blockEl.appendChild(overlay);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'block-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Eliminar bloque';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeBlock(id);
        });
        blockEl.appendChild(deleteBtn);

        // Drag events
        blockEl.addEventListener('mousedown', (e) => startDrag(e, blockEl));
        blockEl.addEventListener('touchstart', (e) => startDrag(e, blockEl), { passive: false });

        // Add to DOM and State
        canvas.appendChild(blockEl);
        
        const blockData = { id, color, size, shape, x, y };
        blocks.push(blockData);
        
        updateCanvasState();
        
        // Soft click/haptic effect
        playTickEffect();
    }

    /**
     * Remove block by ID
     */
    function removeBlock(id) {
        const blockEl = document.getElementById(id);
        if (blockEl) {
            // Animation class/out effect
            blockEl.style.transform = 'scale(0)';
            blockEl.style.opacity = '0';
            setTimeout(() => {
                blockEl.remove();
            }, 300);
        }
        
        blocks = blocks.filter(b => b.id !== id);
        updateCanvasState();
        playTickEffect(true);
    }

    /**
     * Clear all blocks from the canvas
     */
    function clearCanvas() {
        const blockElements = canvas.querySelectorAll('.block');
        blockElements.forEach(el => {
            el.style.transform = 'scale(0)';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        });
        blocks = [];
        updateCanvasState();
    }

    /**
     * Drag-and-Drop Implementation
     */
    function startDrag(e, blockEl) {
        // Bring to front
        canvas.appendChild(blockEl);
        
        activeDragBlock = blockEl;
        
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        const rect = blockEl.getBoundingClientRect();
        
        dragOffset.x = clientX - rect.left;
        dragOffset.y = clientY - rect.top;
        
        // Update state to bring to front
        const blockId = blockEl.id;
        const blockIdx = blocks.findIndex(b => b.id === blockId);
        if (blockIdx > -1) {
            const [blockData] = blocks.splice(blockIdx, 1);
            blocks.push(blockData); // Put at end of array (front-most)
        }

        e.preventDefault();
    }

    function doDrag(e) {
        if (!activeDragBlock) return;

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        const canvasRect = canvas.getBoundingClientRect();
        
        let newX = clientX - canvasRect.left - dragOffset.x;
        let newY = clientY - canvasRect.top - dragOffset.y;
        
        // Bounds checking
        const blockRect = activeDragBlock.getBoundingClientRect();
        const maxLimitX = canvasRect.width - blockRect.width;
        const maxLimitY = canvasRect.height - blockRect.height;
        
        newX = Math.max(0, Math.min(newX, maxLimitX));
        newY = Math.max(0, Math.min(newY, maxLimitY));
        
        activeDragBlock.style.left = `${newX}px`;
        activeDragBlock.style.top = `${newY}px`;

        // Update coordinates in state
        const blockData = blocks.find(b => b.id === activeDragBlock.id);
        if (blockData) {
            blockData.x = newX;
            blockData.y = newY;
        }
    }

    function endDrag() {
        activeDragBlock = null;
    }

    // Global drag listener on window for smoother tracking
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    /**
     * LocalStorage Settings Save/Load
     */
    function saveConfig() {
        localStorage.setItem('building_blocks_config', JSON.stringify(blocks));
        
        // Show momentary success state on button
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✨ ¡Guardado! ✨';
        saveBtn.style.background = 'rgba(16, 185, 129, 0.2)';
        saveBtn.style.borderColor = '#10b981';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
            saveBtn.style.borderColor = '';
        }, 1500);
    }

    function loadConfig() {
        const saved = localStorage.getItem('building_blocks_config');
        if (saved) {
            try {
                const loadedBlocks = JSON.parse(saved);
                loadedBlocks.forEach(bConfig => {
                    createBlock(bConfig);
                });
            } catch (err) {
                console.error("Error loading config:", err);
            }
        }
    }

    /**
     * Audio/Vibration Feedback (Micro-interactions)
     */
    function playTickEffect(isDelete = false) {
        if ('vibrate' in navigator) {
            navigator.vibrate(isDelete ? 15 : 5);
        }
    }

    // Event Listeners
    addBlockBtn.addEventListener('click', () => createBlock());
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveConfig);

    // Initial Load
    loadConfig();
});
