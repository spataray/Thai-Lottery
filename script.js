/**
 * Thai Lottery Checker - Main JavaScript File
 */

// Wait for DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    // Try to fetch latest results from API first
    await handleRefresh();
    
    populateDrawDateDropdown();
    setupFormSubmitHandler();
    displaySongkranGreeting();
    setupFunFeatures();

    // Setup manual refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }

    // Keep background polling every 30 mins as a backup
    setInterval(handleRefresh, 30 * 60 * 1000); 
}

/**
 * Setup logic for fun interactive features
 */
function setupFunFeatures() {
    setupWaterGun();
    setupLuckyGenerator();
    startCountdown();
}

/**
 * Interactive Water Gun Cursor logic
 */
function setupWaterGun() {
    document.addEventListener('mousedown', function(e) {
        createSplash(e.clientX, e.clientY, 15);
    });
}

/**
 * Create a water splash effect at specific coordinates
 */
function createSplash(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'splash-particle';
        
        // Random size
        const size = Math.random() * 10 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Position at click
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random trajectory
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 200;
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        
        document.body.appendChild(particle);
        
        // Cleanup
        setTimeout(() => particle.remove(), 800);
    }
}

/**
 * Lucky Number Generator logic
 */
function setupLuckyGenerator() {
    const shakeBtn = document.getElementById('shake-btn');
    const luckyDisplay = document.getElementById('lucky-display');
    
    if (!shakeBtn || !luckyDisplay) return;
    
    shakeBtn.addEventListener('click', function() {
        // Add shake animation
        luckyDisplay.classList.add('shake-animation');
        shakeBtn.disabled = true;
        luckyDisplay.textContent = '...';
        
        setTimeout(() => {
            const luckyNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            luckyDisplay.textContent = luckyNum.split('').join(' ');
            luckyDisplay.classList.remove('shake-animation');
            shakeBtn.disabled = false;
            
            // Celebration splash!
            const rect = luckyDisplay.getBoundingClientRect();
            createSplash(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
        }, 600);
    });
}

/**
 * Countdown Timer logic for next draw (1st and 16th of each month)
 */
function startCountdown() {
    const timerDisplay = document.getElementById('countdown-timer');
    if (!timerDisplay) return;
    
    function updateTimer() {
        const now = new Date();
        let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30, 0);
        
        // Find next 1st or 16th
        if (now.getDate() > 16 || (now.getDate() === 16 && now.getHours() >= 15)) {
            // Next month 1st
            target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 14, 30, 0);
        } else if (now.getDate() > 1 || (now.getDate() === 1 && now.getHours() >= 15)) {
            // This month 16th
            target = new Date(now.getFullYear(), now.getMonth(), 16, 14, 30, 0);
        } else {
            // This month 1st
            target = new Date(now.getFullYear(), now.getMonth(), 1, 14, 30, 0);
        }
        
        const diff = target - now;
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        
        timerDisplay.innerHTML = `
            <div class="countdown-item">${d}<span class="countdown-label">Days</span></div>
            <div class="countdown-item">${h}<span class="countdown-label">Hrs</span></div>
            <div class="countdown-item">${m}<span class="countdown-label">Min</span></div>
            <div class="countdown-item">${s}<span class="countdown-label">Sec</span></div>
        `;
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

/**
 * Handles the logic for refreshing the data and updating the UI
 */
async function handleRefresh() {
    const statusDiv = document.getElementById('api-status');
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (statusDiv) statusDiv.innerHTML = 'Connecting to official servers...';
    if (refreshBtn) refreshBtn.classList.add('loading');

    const hasNewData = await fetchLatestResults();
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    if (hasNewData !== null) {
        if (statusDiv) {
            statusDiv.innerHTML = `✅ Successfully synced with official results at ${timeStr}`;
            statusDiv.className = 'api-status success';
        }
        displayLatestResults();
        populateDrawDateDropdown();
    } else {
        if (statusDiv) {
            statusDiv.innerHTML = `⚠️ Using offline data (Last sync attempt failed at ${timeStr})`;
            statusDiv.className = 'api-status error';
        }
    }
    
    if (refreshBtn) refreshBtn.classList.remove('loading');
}

/**
 * Fetch the latest lottery results from a live API
 * @returns {Promise<boolean|null>} True if successful, null if failed
 */
async function fetchLatestResults() {
    try {
        console.log('Fetching live lottery data...');
        const response = await fetch('https://lotto.api.rayriffy.com/latest');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const apiData = await response.json();
        
        if (apiData && apiData.response) {
            const latest = apiData.response;
            const isoDate = formatDateToISO(latest.date_raw || latest.date.replace(/[^0-9]/g, '')); 
            
            // Adjust mapping based on real Rayriffy API structure observed in CURL
            const mappedResult = {
                date: isoDate,
                dateDisplay: latest.date,
                firstPrize: latest.prizes[0].number[0],
                twoDigit: latest.runningNumbers[2].number[0],
                threeDigitFront: latest.runningNumbers[0].number,
                threeDigitBack: latest.runningNumbers[1].number
            };

            if (typeof lotteryResults !== 'undefined') {
                const alreadyExists = lotteryResults.find(r => r.date === mappedResult.date);
                if (!alreadyExists) {
                    lotteryResults.unshift(mappedResult);
                } else {
                    // Update existing record with the latest data if needed
                    Object.assign(alreadyExists, mappedResult);
                }
                return true;
            }
        }
    } catch (error) {
        console.warn('Could not fetch live data:', error);
        return null;
    }
    return false;
}

/**
 * Helper to convert API date (DDMMYYYY or Thai string) to ISO format (YYYY-MM-DD)
 */
function formatDateToISO(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Extract only digits
    const digits = dateStr.replace(/[^0-9]/g, '');
    
    if (digits.length === 8) {
        const day = digits.substring(0, 2);
        const month = digits.substring(2, 4);
        let year = parseInt(digits.substring(4, 8));
        
        // Handle Thai Buddhist Era (BE) to Western year conversion (BE - 543)
        if (year > 2500) {
            year -= 543;
        }
        
        return `${year}-${month}-${day}`;
    }
    
    return new Date().toISOString().split('T')[0];
}

/**
 * Display a festive Songkran greeting if it's Songkran (April 13-15)
 */
function displaySongkranGreeting() {
    const now = new Date();
    const month = now.getMonth(); 
    const day = now.getDate();
    
    if (month === 3 && day >= 10 && day <= 20) {
        const header = document.querySelector('header');
        if (!header || document.querySelector('.songkran-greeting')) return;
        
        const greeting = document.createElement('div');
        greeting.className = 'songkran-greeting';
        greeting.innerHTML = `
            <div class="songkran-content">
                <span class="emoji">💦</span>
                <span class="text">Happy Songkran Festival! สุขสันต์วันสงกรานต์!</span>
                <span class="emoji">🌸</span>
            </div>
        `;
        header.prepend(greeting);
    }
}

/**
 * Display the latest lottery results on the page
 */
function displayLatestResults() {
    const resultsDisplay = document.getElementById('results-display');
    
    if (typeof lotteryResults === 'undefined' || !lotteryResults || lotteryResults.length === 0) {
        if (resultsDisplay) resultsDisplay.innerHTML = '<p class="error">No lottery results available.</p>';
        return;
    }
    
    const latest = lotteryResults[0];
    const neighbors = getNeighbors(latest.firstPrize);
    
    let html = `
        <div class="latest-result">
            <h3>Draw Date: ${latest.dateDisplay}</h3>
            <div class="prize-section first-prize">
                <h4>First Prize (รางวัลที่ 1)</h4>
                <p class="lottery-numbers">${formatNumber(latest.firstPrize)}</p>
            </div>
            <div class="prize-section">
                <h4>First Prize Neighbors (รางวัลข้างเคียงรางวัลที่ 1)</h4>
                <p class="lottery-numbers">${neighbors.map(formatNumber).join(' , ')}</p>
            </div>
            <div class="prize-section">
                <h4>Last Two Digits (รางวัลเลขท้าย 2 ตัว)</h4>
                <p class="lottery-numbers">${formatNumber(latest.twoDigit)}</p>
            </div>
            <div class="prize-section">
                <h4>First Three Digits (รางวัลเลขหน้า 3 ตัว)</h4>
                <p class="lottery-numbers">${latest.threeDigitFront.map(formatNumber).join(', ')}</p>
            </div>
            <div class="prize-section">
                <h4>Last Three Digits (รางวัลเลขท้าย 3 ตัว)</h4>
                <p class="lottery-numbers">${latest.threeDigitBack.map(formatNumber).join(', ')}</p>
            </div>
        </div>
    `;
    
    if (resultsDisplay) resultsDisplay.innerHTML = html;
}

/**
 * Format a number string for display
 */
function formatNumber(num) {
    if (!num) return '';
    return num.split('').join(' ');
}

/**
 * Populate the draw date dropdown
 */
function populateDrawDateDropdown() {
    const dropdown = document.getElementById('draw-date');
    if (!dropdown || typeof lotteryResults === 'undefined' || !lotteryResults) return;
    
    const currentValue = dropdown.value;
    dropdown.innerHTML = '<option value="">Select a Draw Date</option>';
    
    lotteryResults.forEach(function(draw) {
        const option = document.createElement('option');
        option.value = draw.date;
        option.textContent = draw.dateDisplay;
        dropdown.appendChild(option);
    });

    if (currentValue) dropdown.value = currentValue;
}

/**
 * Setup the form submit handler
 */
function setupFormSubmitHandler() {
    const form = document.getElementById('check-form');
    if (!form) return;
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        checkUserTicket();
    });
}

/**
 * Check the user's ticket number
 */
function checkUserTicket() {
    const ticketInput = document.getElementById('user-ticket');
    const dateSelect = document.getElementById('draw-date');
    
    const ticketNumber = ticketInput.value.trim();
    const selectedDate = dateSelect.value;
    
    if (!ticketNumber || ticketNumber.length !== 6 || !/^\d{6}$/.test(ticketNumber)) {
        showResult('Please enter a valid 6-digit number.', 'error');
        return;
    }
    
    if (!selectedDate) {
        showResult('Please select a draw date.', 'error');
        return;
    }
    
    const selectedDraw = lotteryResults.find(draw => draw.date === selectedDate);
    
    if (!selectedDraw) {
        showResult('Selected draw not found.', 'error');
        return;
    }
    
    const wins = checkForWin(ticketNumber, selectedDraw);
    
    if (wins.length > 0) {
        let winMessage = '🎉 Congratulations! You won the following prize(s):<ul>';
        wins.forEach(win => winMessage += `<li>${win}</li>`);
        winMessage += '</ul>';
        showResult(winMessage, 'win');
    } else {
        showResult('Sorry, your number did not match any winning numbers for this draw.', 'lose');
    }
}

/**
 * Check if the ticket number matches any winning numbers
 */
function checkForWin(ticketNumber, draw) {
    const wins = [];

    if (ticketNumber === draw.firstPrize) {
        wins.push('First Prize (รางวัลที่ 1) - 6 Million Baht!');
    }
    
    const neighbors = getNeighbors(draw.firstPrize);
    if (neighbors.includes(ticketNumber)) {
        wins.push('First Prize Neighbor (รางวัลข้างเคียงรางวัลที่ 1) - 100,000 Baht');
    }

    const lastTwo = ticketNumber.substring(4, 6);
    if (lastTwo === draw.twoDigit) {
        wins.push('Last Two Digits (รางวัลเลขท้าย 2 ตัว) - 2,000 Baht');
    }
    
    const firstThree = ticketNumber.substring(0, 3);
    if (draw.threeDigitFront.includes(firstThree)) {
        wins.push('First Three Digits (รางวัลเลขหน้า 3 ตัว) - 4,000 Baht');
    }
    
    const lastThree = ticketNumber.substring(3, 6);
    if (draw.threeDigitBack.includes(lastThree)) {
        wins.push('Last Three Digits (รางวัลเลขท้าย 3 ตัว) - 4,000 Baht');
    }
    
    return wins;
}

/**
 * Calculate the neighbors (+/- 1)
 */
function getNeighbors(firstPrize) {
    if (!firstPrize) return ['', ''];
    const num = parseInt(firstPrize, 10);
    const n1 = (num - 1 + 1000000) % 1000000;
    const n2 = (num + 1) % 1000000;
    
    return [
        n1.toString().padStart(6, '0'),
        n2.toString().padStart(6, '0')
    ];
}

/**
 * Display a result message
 */
function showResult(message, type) {
    const resultDiv = document.getElementById('check-result');
    if (!resultDiv) return;

    resultDiv.innerHTML = `<p class="${type}" role="status" aria-live="polite">${message}</p>`;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Trigger celebration splash if win!
    if (type === 'win') {
        const rect = resultDiv.getBoundingClientRect();
        createSplash(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
    }
}