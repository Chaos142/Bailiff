let blocks = [
    { id: 1, name: "Opening Statement", time: "05:00", linked: null },
    { id: 2, name: "Direct Examination", time: "25:00", linked: 3 },
    { id: 3, name: "Cross Examination", time: "20:00", linked: 2 },
    { id: 4, name: "Closing Argument", time: "05:00", linked: null }
];

const blockList = document.getElementById("block-list");
const editPanel = document.getElementById("block-edit-panel");
const editNameInput = document.getElementById("edit-block-name");
const editTimeInput = document.getElementById("edit-block-time");
const editLinkSelect = document.getElementById("edit-block-link");
const linkLabel = document.getElementById("link-label");
const saveBtn = document.getElementById("save-block-btn");
const cancelBtn = document.getElementById("cancel-edit-btn");
const advancedToggle = document.getElementById("advanced-toggle");
const pNameInput = document.getElementById("p-name");
const dNameInput = document.getElementById("d-name");
let currentEditingId = null;

const placeholder = document.createElement("div");
placeholder.className = "block-placeholder";

const ICON_LINK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="link-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
const ICON_TRASH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`;

function updateLinkVisibility() {
    linkLabel.style.display = advancedToggle.checked ? 'flex' : 'none';
}

advancedToggle.addEventListener('change', () => {
    updateLinkVisibility();
    renderBlocks();
});

function createBlockElement(block) {
    const div = document.createElement("div");
    div.className = "block-card";
    div.dataset.id = block.id;
    div.setAttribute("draggable", "true");

    const linkIndicator = (block.linked && advancedToggle.checked) ? `<span class="link-icon">${ICON_LINK}</span>` : '';

    div.innerHTML = `
        <div class="block-main-content">
            <span class="block-name">${linkIndicator}${block.name}</span>
            <span class="block-time">${block.time}</span>
        </div>
        <div class="block-controls">
            <button class="block-delete" title="Delete Block">${ICON_TRASH}</button>
        </div>`;

    div.addEventListener('dragstart', () => {
        closeEditPanel();
        setTimeout(() => div.classList.add('dragging'), 0);
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        if (placeholder.parentNode) {
            placeholder.replaceWith(div);
        }
        placeholder.remove();
        syncArrayOrder();
    });

    return div;
}

editTimeInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length >= 3) v = v.slice(0, v.length - 2) + ':' + v.slice(v.length - 2);
    e.target.value = v;
});

function openEditPanel(id) {
    if (currentEditingId === id) return closeEditPanel();
    const block = blocks.find(b => b.id === id);
    const card = document.querySelector(`.block-card[data-id="${id}"]`);
    
    currentEditingId = id;
    editNameInput.value = block.name;
    editTimeInput.value = block.time;

    editLinkSelect.innerHTML = '<option value="">None</option>';
    blocks.forEach(b => {
        if (b.id !== id) {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.name;
            if (block.linked === b.id) opt.selected = true;
            editLinkSelect.appendChild(opt);
        }
    });
    
    updateLinkVisibility();
    card.after(editPanel);
    editPanel.classList.remove("hidden");
}

function saveBlockChanges() {
    const block = blocks.find(b => b.id === currentEditingId);
    if (!block) return;

    block.name = editNameInput.value;
    block.time = editTimeInput.value.length < 3 ? "01:00" : editTimeInput.value;
    block.linked = editLinkSelect.value ? parseInt(editLinkSelect.value) : null;

    renderBlocks();
    closeEditPanel();
}

function closeEditPanel() { 
    editPanel.classList.add("hidden"); 
    currentEditingId = null; 
}

function deleteBlock(id) {
    if (currentEditingId === id) closeEditPanel();
    
    const card = document.querySelector(`.block-card[data-id="${id}"]`);
    if (!card) return;

    card.classList.add("removing");
    setTimeout(() => { 
        card.remove(); 
        blocks = blocks.filter(b => b.id !== id);
        blocks.forEach(b => { if (b.linked === id) b.linked = null; });
        syncArrayOrder();
    }, 400);
}

function renderBlocks() {
    blockList.innerHTML = '';
    blocks.forEach(b => blockList.appendChild(createBlockElement(b)));
}

blockList.addEventListener("click", e => {
    const card = e.target.closest(".block-card");
    if (!card || e.target.closest('#block-edit-panel') || card.classList.contains('removing')) return;
    
    const deleteBtn = e.target.closest(".block-delete");
    if (deleteBtn) {
        deleteBlock(parseInt(card.dataset.id));
    } else {
        openEditPanel(parseInt(card.dataset.id));
    }
});

document.getElementById("add-block-btn").addEventListener("click", () => {
    const newB = { id: Date.now(), name: "New Block", time: "01:00", linked: null };
    blocks.push(newB);
    blockList.appendChild(createBlockElement(newB));
});

saveBtn.addEventListener("click", saveBlockChanges);
cancelBtn.addEventListener("click", closeEditPanel);

blockList.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;

    const afterElement = getDragAfterElement(blockList, e.clientY);
    const isAtEnd = afterElement == null && dragging === blockList.lastElementChild;
    const isBeforeSelf = afterElement === dragging;
    const isAfterSelf = afterElement === dragging.nextElementSibling;

    if (isAtEnd || isBeforeSelf || isAfterSelf) {
        placeholder.remove();
    } else {
        if (afterElement == null) {
            blockList.appendChild(placeholder);
        } else {
            blockList.insertBefore(placeholder, afterElement);
        }
    }
});

function getDragAfterElement(container, y) {
    const draggables = [...container.querySelectorAll('.block-card:not(.dragging):not(.block-placeholder):not(.removing)')];
    return draggables.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function syncArrayOrder() {
    blocks = [...blockList.querySelectorAll('.block-card:not(.removing)')].map(c => 
        blocks.find(b => b.id === parseInt(c.dataset.id))
    );
}

document.getElementById("start-trial-btn").addEventListener("click", () => {
    const leftTeam = pNameInput.value || 'Plaintiff';
    const rightTeam = dNameInput.value || 'Defense';
    const advanced = advancedToggle.checked;
    
    const params = new URLSearchParams({
        leftTeam,
        rightTeam,
        advanced: advanced.toString(),
        blocks: encodeURIComponent(JSON.stringify(blocks))
    });
    
    window.location.href = `timers.html?${params.toString()}`;
});

renderBlocks();
updateLinkVisibility();