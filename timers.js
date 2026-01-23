/*
30 sec should be different color than paused time
after 0, make it just be red and count up (it should still have same controls, but adding paused time will add instead of subtract because its essentially negative, but dont display negative, left sidebar should show that time in red)
resuming should immediately switch to the proper color, right now its switching to blue and then updating after the next tick
*/
let blocks = [
    { id: 1, name: "Opening Statement", time: "05:00", linked: null, remainingSeconds: null },
    { id: 2, name: "Direct Examination", time: "25:00", linked: 3, remainingSeconds: null },
    { id: 3, name: "Cross Examination", time: "20:00", linked: 2, remainingSeconds: null },
    { id: 4, name: "Closing Argument", time: "05:00", linked: null, remainingSeconds: null }
];

const ICON_LINK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="link-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;

let currentBlockIndex = 0;
let isRunning = false;
let isPaused = false;
let isStopped = false;
let timeRemaining = 0; // in seconds
let originalTimeBeforePause = 0; // track time when pause started
let pauseElapsed = 0;
let timerInterval = null;
let pauseInterval = null;

const widgetsContainer = document.getElementById('block-widgets');
const countdown = document.getElementById('countdown');
const currentBlockName = document.getElementById('current-block-name');
const timeLabel = document.getElementById('time-label');
const secondaryTimer = document.getElementById('secondary-timer');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const nextBtn = document.getElementById('next-btn');
const timerControls = document.getElementById('timer-controls');

function parseTime(timeStr) {
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderWidgets() {
    widgetsContainer.innerHTML = '';
    blocks.forEach((block, index) => {
        const widget = document.createElement('div');
        widget.className = 'block-widget';
        if (index === currentBlockIndex) widget.classList.add('active');
        if (block.remainingSeconds !== null && block.remainingSeconds === 0) widget.classList.add('completed');

        let remaining;
        if (block.remainingSeconds !== null) {
            remaining = block.remainingSeconds;
        } else {
            remaining = parseTime(block.time);
        }

        const linkIcon = block.linked ? `<span class="link-icon">${ICON_LINK}</span>` : '';

        widget.innerHTML = `
            <div class="widget-name">${linkIcon}${block.name}</div>
            <div class="widget-times">
                <span class="widget-remaining">${formatTime(remaining)}</span>
                <span class="widget-total">${block.time}</span>
            </div>
        `;

        widget.addEventListener('click', () => selectBlock(index));
        widgetsContainer.appendChild(widget);
    });
}

function initializeTimerMode(newBlocks) {
    // Override the global blocks array with our new Class Instances
    blocks = newBlocks; 
    
    // UI Toggles
    document.getElementById('setup-view').classList.add('hidden');
    document.getElementById('timer-view').classList.remove('hidden');

    // Reset Timer State
    currentBlockIndex = 0;
    loadBlock();   // This will now use the class properties (.remaining)
    renderWidgets();
}

function selectBlock(index) {
    // If we're running or paused, stop the current timer
    if (isRunning || isPaused) {
        fullStop();
    }
    currentBlockIndex = index;
    loadBlock();
}

function loadBlock() {
    const block = blocks[currentBlockIndex];
    if (block.remainingSeconds !== null) {
        timeRemaining = block.remainingSeconds;
    } else {
        timeRemaining = parseTime(block.time);
        block.remainingSeconds = timeRemaining;
    }
    currentBlockName.textContent = block.name;
    countdown.textContent = formatTime(timeRemaining);
    countdown.className = 'countdown';
    timeLabel.textContent = 'Time Remaining';
    secondaryTimer.classList.remove('visible');
    
    // Reset all button states
    startBtn.style.display = 'inline-block';
    startBtn.textContent = 'Start';
    startBtn.className = 'control-btn btn-start';
    stopBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    
    // Remove any pause buttons
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
    
    timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            blocks[currentBlockIndex].remainingSeconds = timeRemaining;
            countdown.textContent = formatTime(timeRemaining);
            
            // Update color based on time
            if (timeRemaining <= 10) {
                countdown.className = 'countdown critical';
            } else if (timeRemaining <= 30) {
                countdown.className = 'countdown warning';
            }

            renderWidgets(); // Update sidebar
        } else {
            // Time's up
            fullStop();
            nextBtn.style.display = 'inline-block';
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    isRunning = false;
    clearInterval(timerInterval);
    
    originalTimeBeforePause = timeRemaining;
    pauseElapsed = 0;
    
    // Update UI to show pause
    countdown.textContent = '00:00';
    countdown.className = 'countdown paused';
    timeLabel.textContent = 'Time Paused';
    secondaryTimer.textContent = formatTime(originalTimeBeforePause);
    secondaryTimer.classList.add('visible');
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    
    // Show pause control buttons
    showPauseButtons();
    
    pauseInterval = setInterval(() => {
        pauseElapsed++;
        countdown.textContent = formatTime(pauseElapsed);
    }, 1000);
}

function stopTimerButton() {
    if (!isRunning && !isPaused) return;
    
    // If currently paused, clean up pause state first
    if (isPaused) {
        clearInterval(pauseInterval);
        isPaused = false;
        const pauseButtons = document.querySelectorAll('.pause-btn');
        pauseButtons.forEach(btn => btn.remove());
    }
    
    // If running, stop the timer
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
    }
    
    isStopped = true;
    
    // Update UI
    countdown.className = 'countdown';
    timeLabel.textContent = 'Stopped';
    secondaryTimer.classList.remove('visible');
    
    // Show only restart button
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

function showPauseButtons() {
    // Remove start button temporarily
    const existingPauseButtons = document.querySelectorAll('.pause-btn');
    existingPauseButtons.forEach(btn => btn.remove());
    
    const deductBtn = document.createElement('button');
    deductBtn.className = 'control-btn btn-deduct pause-btn';
    deductBtn.textContent = 'Deduct from Time';
    deductBtn.addEventListener('click', resumeWithDeduction);
    
    const discardBtn = document.createElement('button');
    discardBtn.className = 'control-btn btn-discard pause-btn';
    discardBtn.textContent = 'Discard Pause';
    discardBtn.addEventListener('click', resumeWithoutDeduction);
    
    timerControls.appendChild(deductBtn);
    
    // Add linked deduction button if current block is linked
    const currentBlock = blocks[currentBlockIndex];
    if (currentBlock.linked !== null) {
        const linkedBlock = blocks.find(b => b.id === currentBlock.linked);
        const deductLinkedBtn = document.createElement('button');
        deductLinkedBtn.className = 'control-btn btn-deduct-linked pause-btn';
        deductLinkedBtn.textContent = `Deduct from ${linkedBlock.name}`;
        deductLinkedBtn.addEventListener('click', resumeWithLinkedDeduction);
        timerControls.appendChild(deductLinkedBtn);
    }
    
    timerControls.appendChild(discardBtn);
}

function resumeWithDeduction() {
    // Deduct pause time from current block's remaining time
    timeRemaining = Math.max(0, originalTimeBeforePause - pauseElapsed);
    blocks[currentBlockIndex].remainingSeconds = timeRemaining;
    resumeTimer();
}

function resumeWithLinkedDeduction() {
    // Deduct pause time from linked block's remaining time
    const currentBlock = blocks[currentBlockIndex];
    const linkedBlock = blocks.find(b => b.id === currentBlock.linked);
    
    if (linkedBlock) {
        const linkedRemaining = linkedBlock.remainingSeconds !== null ? 
            linkedBlock.remainingSeconds : parseTime(linkedBlock.time);
        linkedBlock.remainingSeconds = Math.max(0, linkedRemaining - pauseElapsed);
    }
    
    // Keep current block's time unchanged
    timeRemaining = originalTimeBeforePause;
    blocks[currentBlockIndex].remainingSeconds = timeRemaining;
    resumeTimer();
}

function resumeWithoutDeduction() {
    // Discard pause time, keep original remaining time
    timeRemaining = originalTimeBeforePause;
    blocks[currentBlockIndex].remainingSeconds = timeRemaining;
    resumeTimer();
}

function resumeTimer() {
    clearInterval(pauseInterval);
    isPaused = false;
    pauseElapsed = 0;
    
    // Clean up pause buttons
    const pauseButtons = document.querySelectorAll('.pause-btn');
    pauseButtons.forEach(btn => btn.remove());
    
    // Restore UI
    countdown.textContent = formatTime(timeRemaining);
    countdown.className = 'countdown';
    timeLabel.textContent = 'Time Remaining';
    secondaryTimer.classList.remove('visible');
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'inline-block';
    
    renderWidgets();
    startTimer();
}

function nextBlock() {
    if (currentBlockIndex < blocks.length - 1) {
        currentBlockIndex++;
        fullStop();
        loadBlock();
    }
}

// Event listeners
startBtn.addEventListener('click', () => {
    if (isStopped) {
        // Restart from stopped state
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

// Initialize
loadBlock();