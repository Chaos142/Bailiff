// Get data from URL params or use defaults
const urlParams = new URLSearchParams(window.location.search);
const leftTeamName = urlParams.get('leftTeam') || 'Plaintiff';
const rightTeamName = urlParams.get('rightTeam') || 'Defense';
const advancedMode = urlParams.get('advanced') === 'true';

// Parse block templates
let blockTemplates = [];
try {
    blockTemplates = JSON.parse(decodeURIComponent(urlParams.get('blocks') || '[]'));
} catch (e) {
    blockTemplates = [
        { id: 1, name: "Opening Statement", time: "05:00", linked: null },
        { id: 2, name: "Direct Examination", time: "25:00", linked: 3 },
        { id: 3, name: "Cross Examination", time: "20:00", linked: 2 },
        { id: 4, name: "Closing Argument", time: "05:00", linked: null }
    ];
}

// Create blocks for both teams
let blocks = {
    left: blockTemplates.map(t => ({ ...t, team: 'left', remainingSeconds: null })),
    right: blockTemplates.map(t => ({ ...t, team: 'right', remainingSeconds: null }))
};

const ICON_LINK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="link-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;

let currentBlockId = null;
let currentTeam = null;
let isRunning = false;
let isPaused = false;
let isStopped = false;
let timeRemaining = 0;
let originalTimeBeforePause = 0;
let pauseElapsed = 0;
let timerInterval = null;
let pauseInterval = null;

const leftWidgets = document.getElementById('left-widgets');
const rightWidgets = document.getElementById('right-widgets');
const countdown = document.getElementById('countdown');
const currentBlockName = document.getElementById('current-block-name');
const timeLabel = document.getElementById('time-label');
const secondaryTimer = document.getElementById('secondary-timer');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const nextBtn = document.getElementById('next-btn');
const timerControls = document.getElementById('timer-controls');

// Set team names
document.getElementById('left-team-name').textContent = leftTeamName;
document.getElementById('right-team-name').textContent = rightTeamName;

function parseTime(timeStr) {
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
}

function formatTime(seconds) {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateCountdownColor() {
    countdown.classList.remove('warning', 'critical', 'paused', 'overtime');
    if (timeRemaining < 0) {
        countdown.classList.add('overtime');
    } else if (timeRemaining <= 10) {
        countdown.classList.add('critical');
    } else if (timeRemaining <= 30) {
        countdown.classList.add('warning');
    }
}

function renderWidgets() {
    leftWidgets.innerHTML = '';
    rightWidgets.innerHTML = '';
    
    ['left', 'right'].forEach(team => {
        blocks[team].forEach(block => {
            const widget = document.createElement('div');
            widget.className = 'block-widget';
            
            if (block.id === currentBlockId && block.team === currentTeam) {
                widget.classList.add('active');
            }
            
            // Highlight linked block in opposing team
            if (advancedMode && currentBlockId && currentTeam) {
                const currentBlock = blocks[currentTeam].find(b => b.id === currentBlockId);
                if (currentBlock && currentBlock.linked === block.id && block.team !== currentTeam) {
                    widget.classList.add('linked-highlight');
                }
            }
            
            if (block.remainingSeconds !== null && block.remainingSeconds <= 0) {
                widget.classList.add('completed');
            }

            let remaining;
            if (block.remainingSeconds !== null) {
                remaining = block.remainingSeconds;
            } else {
                remaining = parseTime(block.time);
            }

            const linkIcon = block.linked && advancedMode ? `<span class="link-icon">${ICON_LINK}</span>` : '';
            
            // Determine color class for sidebar timer
            let remainingClass = 'widget-remaining';
            if (remaining < 0) {
                remainingClass += ' negative';
            } else if (remaining <= 10) {
                remainingClass += ' critical';
            } else if (remaining <= 30) {
                remainingClass += ' warning';
            }

            widget.innerHTML = `
                <div class="widget-name">${linkIcon}${block.name}</div>
                <div class="widget-times">
                    <span class="${remainingClass}">${formatTime(remaining)}</span>
                    <span class="widget-total">${block.time}</span>
                </div>
            `;

            widget.addEventListener('click', () => selectBlock(block.id, block.team));
            
            if (team === 'left') {
                leftWidgets.appendChild(widget);
            } else {
                rightWidgets.appendChild(widget);
            }
        });
    });
}

function selectBlock(blockId, team) {
    if (isRunning || isPaused) {
        fullStop();
    }
    currentBlockId = blockId;
    currentTeam = team;
    loadBlock();
}

function loadBlock() {
    const block = blocks[currentTeam].find(b => b.id === currentBlockId);
    if (!block) return;
    
    if (block.remainingSeconds !== null) {
        timeRemaining = block.remainingSeconds;
    } else {
        timeRemaining = parseTime(block.time);
        block.remainingSeconds = timeRemaining;
    }
    
    currentBlockName.textContent = `${currentTeam === 'left' ? leftTeamName : rightTeamName} - ${block.name}`;
    countdown.textContent = formatTime(timeRemaining);
    updateCountdownColor();
    timeLabel.textContent = 'Time Remaining';
    secondaryTimer.classList.remove('visible');
    
    startBtn.style.display = 'inline-block';
    startBtn.textContent = 'Start';
    startBtn.className = 'control-btn btn-start';
    stopBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    
    const pauseButtons = document.querySelectorAll('.pause-btn');
    pauseButtons.forEach(btn => btn.remove());
    
    renderWidgets();
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    isPaused = false;
    isStopped = false;
    startBtn.textContent = 'Pause';
    startBtn.className = 'control-btn btn-pause';
    stopBtn.style.display = 'inline-block';
    timeLabel.textContent = 'Time Remaining';
    updateCountdownColor(); // Set color immediately when starting
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        const block = blocks[currentTeam].find(b => b.id === currentBlockId);
        if (block) block.remainingSeconds = timeRemaining;
        
        countdown.textContent = formatTime(timeRemaining);
        updateCountdownColor();
        renderWidgets();
    }, 1000);
}

function pauseTimer() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    isRunning = false;
    clearInterval(timerInterval);
    
    originalTimeBeforePause = timeRemaining;
    pauseElapsed = 0;
    
    countdown.textContent = '00:00';
    countdown.classList.remove('warning', 'critical', 'overtime');
    countdown.classList.add('paused');
    timeLabel.textContent = 'Time Paused';
    secondaryTimer.textContent = formatTime(originalTimeBeforePause);
    secondaryTimer.classList.add('visible');
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    
    showPauseButtons();
    
    pauseInterval = setInterval(() => {
        pauseElapsed++;
        countdown.textContent = formatTime(pauseElapsed);
    }, 1000);
}

function showPauseButtons() {
    const existingPauseButtons = document.querySelectorAll('.pause-btn');
    existingPauseButtons.forEach(btn => btn.remove());
    
    if (advancedMode) {
        const deductBtn = document.createElement('button');
        deductBtn.className = 'control-btn btn-deduct pause-btn';
        deductBtn.textContent = 'Sustain Objection (Deduct from Time)';
        deductBtn.addEventListener('click', resumeWithDeduction);
        timerControls.appendChild(deductBtn);
        
        const block = blocks[currentTeam].find(b => b.id === currentBlockId);
        if (block && block.linked !== null) {
            const oppositeTeam = currentTeam === 'left' ? 'right' : 'left';
            const linkedBlock = blocks[oppositeTeam].find(b => b.id === block.linked);
            if (linkedBlock) {
                const deductLinkedBtn = document.createElement('button');
                deductLinkedBtn.className = 'control-btn btn-deduct-linked pause-btn';
                deductLinkedBtn.textContent = `Overrule Objection (Deduct from ${linkedBlock.name})`;
                deductLinkedBtn.addEventListener('click', resumeWithLinkedDeduction);
                timerControls.appendChild(deductLinkedBtn);
            }
        }
    }
    
    const discardBtn = document.createElement('button');
    discardBtn.className = 'control-btn btn-discard pause-btn';
    discardBtn.textContent = 'Resume';
    discardBtn.addEventListener('click', resumeWithoutDeduction);
    timerControls.appendChild(discardBtn);
}

function resumeWithDeduction() {
    timeRemaining = originalTimeBeforePause - pauseElapsed;
    const block = blocks[currentTeam].find(b => b.id === currentBlockId);
    if (block) block.remainingSeconds = timeRemaining;
    resumeTimer();
}

function resumeWithLinkedDeduction() {
    const block = blocks[currentTeam].find(b => b.id === currentBlockId);
    const oppositeTeam = currentTeam === 'left' ? 'right' : 'left';
    const linkedBlock = blocks[oppositeTeam].find(b => b.id === block.linked);
    
    if (linkedBlock) {
        const linkedRemaining = linkedBlock.remainingSeconds !== null ? 
            linkedBlock.remainingSeconds : parseTime(linkedBlock.time);
        linkedBlock.remainingSeconds = linkedRemaining - pauseElapsed;
    }
    
    timeRemaining = originalTimeBeforePause;
    if (block) block.remainingSeconds = timeRemaining;
    resumeTimer();
}

function resumeWithoutDeduction() {
    timeRemaining = originalTimeBeforePause;
    const block = blocks[currentTeam].find(b => b.id === currentBlockId);
    if (block) block.remainingSeconds = timeRemaining;
    resumeTimer();
}

function resumeTimer() {
    clearInterval(pauseInterval);
    isPaused = false;
    pauseElapsed = 0;
    
    const pauseButtons = document.querySelectorAll('.pause-btn');
    pauseButtons.forEach(btn => btn.remove());
    
    countdown.textContent = formatTime(timeRemaining);
    updateCountdownColor();
    timeLabel.textContent = 'Time Remaining';
    secondaryTimer.classList.remove('visible');
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'inline-block';
    
    renderWidgets();
    startTimer();
}

function stopTimerButton() {
    if (!isRunning && !isPaused) return;
    
    if (isPaused) {
        clearInterval(pauseInterval);
        isPaused = false;
        const pauseButtons = document.querySelectorAll('.pause-btn');
        pauseButtons.forEach(btn => btn.remove());
    }
    
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
    }
    
    isStopped = true;
    
    // Don't change color when stopping - keep current color
    timeLabel.textContent = 'Stopped';
    secondaryTimer.classList.remove('visible');
    
    startBtn.textContent = 'Restart';
    startBtn.className = 'control-btn btn-restart';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
}

function fullStop() {
    clearInterval(timerInterval);
    clearInterval(pauseInterval);
    isRunning = false;
    isPaused = false;
    isStopped = false;
    
    const pauseButtons = document.querySelectorAll('.pause-btn');
    pauseButtons.forEach(btn => btn.remove());
}

function nextBlock() {
    const currentIndex = blocks[currentTeam].findIndex(b => b.id === currentBlockId);
    if (currentIndex < blocks[currentTeam].length - 1) {
        const nextBlock = blocks[currentTeam][currentIndex + 1];
        fullStop();
        selectBlock(nextBlock.id, currentTeam);
    }
}

startBtn.addEventListener('click', () => {
    if (isStopped) {
        isStopped = false;
        startTimer();
    } else if (isRunning) {
        pauseTimer();
    } else if (!isPaused) {
        startTimer();
    }
});

stopBtn.addEventListener('click', stopTimerButton);
nextBtn.addEventListener('click', nextBlock);

// Initialize with first block of left team
if (blocks.left.length > 0) {
    selectBlock(blocks.left[0].id, 'left');
}