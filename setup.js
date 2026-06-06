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
let nextBlockId = 5;

const FAMOUS_CASES = [
    // Constitutional / AP Gov
    { p: "Brown", d: "Board of Education" },
    { p: "Miranda", d: "Arizona" },
    { p: "Roe", d: "Wade" },
    { p: "Gideon", d: "Wainwright" },
    { p: "Marbury", d: "Madison" },
    { p: "Plessy", d: "Ferguson" },
    { p: "Dred Scott", d: "Sandford" },
    { p: "McCulloch", d: "Maryland" },
    { p: "Katz", d: "United States" },
    { p: "Terry", d: "Ohio" },
    { p: "Mapp", d: "Ohio" },
    { p: "Tinker", d: "Des Moines" },
    { p: "Schenck", d: "United States" },
    { p: "New York Times", d: "United States" },
    { p: "United States", d: "Nixon" },
    { p: "Bush", d: "Gore" },
    { p: "Engel", d: "Vitale" },
    { p: "Loving", d: "Virginia" },
    { p: "Obergefell", d: "Hodges" },
    { p: "Texas", d: "Johnson" },
    { p: "Citizens United", d: "FEC" },
    { p: "Griswold", d: "Connecticut" },
    { p: "Baker", d: "Carr" },
    { p: "Gibbons", d: "Ogden" },
    { p: "Heart of Atlanta Motel", d: "United States" },
    { p: "Korematsu", d: "United States" },
    { p: "Wisconsin", d: "Yoder" },
    { p: "Regents of the University of California", d: "Bakke" },
    { p: "West Virginia State Board of Education", d: "Barnette" },
    { p: "Brandenburg", d: "Ohio" },
    { p: "Wickard", d: "Filburn" },
    { p: "United States", d: "Lopez" },
    { p: "Kelo", d: "City of New London" },
    { p: "Dobbs", d: "Jackson Women's Health Organization" },
    { p: "Masterpiece Cakeshop", d: "Colorado Civil Rights Commission" },
    { p: "Students for Fair Admissions", d: "Harvard" },
    { p: "Students for Fair Admissions", d: "University of North Carolina" },

    // School cases
    { p: "Morse", d: "Frederick" },
    { p: "Bethel School District", d: "Fraser" },
    { p: "Hazelwood School District", d: "Kuhlmeier" },
    { p: "Mahanoy Area School District", d: "B.L." },

    // Media / Defamation
    { p: "New York Times", d: "Sullivan" },
    { p: "Curtis Publishing", d: "Butts" },
    { p: "Harte-Hanks Communications", d: "Connaughton" },
    { p: "Masson", d: "New Yorker Magazine" },
    { p: "Milkovich", d: "Lorain Journal" },
    { p: "Falwell", d: "Flynt" },
    { p: "Schiavone", d: "Time" },
    { p: "Palin", d: "New York Times" },
    { p: "Post", d: "Keogh" },

    // Celebrity
    { p: "Depp", d: "Heard" },
    { p: "Heard", d: "Depp" },
    { p: "Bollea", d: "Gawker Media" },
    { p: "Swift", d: "Mueller" },
    { p: "Carey", d: "Loftus" },
    { p: "Midler", d: "Ford Motor Company" },

    // Tech
    { p: "Google", d: "Oracle" },
    { p: "Oracle", d: "Google" },
    { p: "Epic Games", d: "Apple" },
    { p: "Apple", d: "Samsung Electronics" },
    { p: "Samsung Electronics", d: "Apple" },
    { p: "eBay", d: "MercExchange" },
    { p: "Carpenter", d: "United States" },
    { p: "Riley", d: "California" },
    { p: "Packingham", d: "North Carolina" },

    // Musk / OpenAI
    { p: "Musk", d: "OpenAI" },
    { p: "OpenAI", d: "Musk" },

    // Trump
    { p: "Trump", d: "Anderson" },
    { p: "Trump", d: "United States" },
    { p: "United States", d: "Trump" },
    { p: "Clinton", d: "Jones" },
    { p: "Trump", d: "Vance" },
    { p: "Anderson", d: "Griswold" },
    { p: "Carroll", d: "Trump" },
    { p: "Carroll", d: "Trump II" },
    { p: "Trump", d: "Carroll" },
    { p: "Trump", d: "CNN" },
    { p: "Trump", d: "Woodward" },
    { p: "Trump Media & Technology Group", d: "Washington Post" },

    // Weird / Funny
    { p: "Naruto", d: "Slater" },
    { p: "Pearson", d: "Chung" },
    { p: "Stambovsky", d: "Ackley" },

    // Government vs weird objects
    { p: "United States", d: "One Book Called Ulysses" },
    { p: "United States", d: "Forty-Three Gallons of Whiskey" },
    { p: "United States", d: "Forty Barrels and Twenty Kegs of Coca-Cola" },
    { p: "United States", d: "Approximately 64,695 Pounds of Shark Fins" },
    { p: "United States", d: "One Tyrannosaurus Bataar Skeleton" },
    { p: "United States", d: "12 200-Foot Reels of Film" },
    { p: "United States", d: "The Schooner Amistad" },
    { p: "United States", d: "The Brig Malek Adhel" },
    { p: "United States", d: "The Steamer Coquitlam" },
    { p: "United States", d: "Approximately 1,191.31 Acres of Land" },

    // Business / Corporate
    { p: "Oracle", d: "Rimini Street" },
    { p: "Google", d: "Gonzalez" },
    { p: "Twitter", d: "Taamneh" },

    // Misc famous
    { p: "Lochner", d: "New York" },
    { p: "Muller", d: "Oregon" },
    { p: "Youngstown Sheet & Tube", d: "Sawyer" },
    { p: "Swann", d: "Charlotte-Mecklenburg Board of Education" },
    { p: "Liebeck", d: "McDonald's Restaurants" },
    { p: "Tennessee", d: "Scopes" }
];

const placeholder = document.createElement("div");
placeholder.className = "block-placeholder";

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const ICON_LINK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="link-svg"><path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"/></svg>`;
const ICON_TRASH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>`;

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
            <span class="block-name">${linkIndicator}${escapeHtml(block.name)}</span>
            <span class="block-time">${escapeHtml(block.time)}</span>
        </div>
        <div class="block-controls">
            <button class="block-delete" title="Delete Block">${ICON_TRASH}</button>
        </div>`;

    div.addEventListener('dragstart', () => {
        div._dragActive = true;
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
        setTimeout(() => { div._dragActive = false; }, 0);
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
    const linkValue = editLinkSelect.value ? parseInt(editLinkSelect.value) : null;
    block.linked = linkValue !== null && blocks.some(b => b.id === linkValue) ? linkValue : null;

    renderBlocks();
    closeEditPanel();
}

function closeEditPanel() { 
    editPanel.classList.add("hidden"); 
    currentEditingId = null; 
}

function deleteBlock(id) {
    const card = document.querySelector(`.block-card[data-id="${id}"]`);
    if (!card) return;
    
    if (currentEditingId === id) closeEditPanel();

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
    if (card._dragActive) return;
    
    const deleteBtn = e.target.closest(".block-delete");
    if (deleteBtn) {
        deleteBlock(parseInt(card.dataset.id));
    } else {
        openEditPanel(parseInt(card.dataset.id));
    }
});

document.getElementById("add-block-btn").addEventListener("click", () => {
    const newB = { id: nextBlockId++, name: "New Block", time: "01:00", linked: null };
    blocks.push(newB);
    blockList.appendChild(createBlockElement(newB));
});

saveBtn.addEventListener("click", saveBlockChanges);
cancelBtn.addEventListener("click", closeEditPanel);

blockList.addEventListener('drop', e => e.preventDefault());

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
    if (blocks.length === 0) {
        alert('Please add at least one block before starting the trial.');
        return;
    }
    
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

const randomCase = FAMOUS_CASES[Math.floor(Math.random() * FAMOUS_CASES.length)];
pNameInput.placeholder = randomCase.p;
dNameInput.placeholder = randomCase.d;