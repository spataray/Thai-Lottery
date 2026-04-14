/**
 * Thai Lottery Checker - Main JavaScript File
 * This script handles all interactive features including:
 * - Displaying latest lottery results
 * - Populating draw date dropdown
 * - Validating user input
 * - Checking winning numbers
 * - Displaying results dynamically
 * 
 * IMPORTANT: This script requires data.js to be loaded first.
 * The HTML file loads data.js before script.js to ensure lotteryResults is available.
 */

// Wait for DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    displayLatestResults();
    populateDrawDateDropdown();
    setupFormSubmitHandler();
    displaySongkranGreeting();
}

/**
 * Display a festive Songkran greeting if it's Songkran (April 13-15)
 */
function displaySongkranGreeting() {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed, April is 3
    const day = now.getDate();
    
    console.log('Checking Songkran Greeting:', { month, day });

    // Songkran is April 13-15, but let's show it for the whole festival week for testing
    if (month === 3 && day >= 10 && day <= 20) {
        const header = document.querySelector('header');
        if (!header) {
            console.error('Header not found for Songkran greeting');
            return;
        }
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
    
    // Check if lotteryResults is available
    if (typeof lotteryResults === 'undefined') {
        resultsDisplay.innerHTML = '<p class="error">Error: Lottery data not loaded. Please ensure data.js is loaded correctly.</p>';
        console.error('lotteryResults is not defined. Make sure data.js is loaded before script.js');
        return;
    }
    
    if (!lotteryResults || lotteryResults.length === 0) {
        resultsDisplay.innerHTML = '<p class="error">No lottery results available.</p>';
        return;
    }
    
    // Get the latest result (first in the array)
    const latest = lotteryResults[0];
    const neighbors = getNeighbors(latest.firstPrize);
    
    // Build the HTML for displaying results
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
    
    resultsDisplay.innerHTML = html;
}

/**
 * Format a number string for display (adds spaces for readability)
 * @param {string} num - The number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    if (!num) return '';
    // Add space between digits for better readability
    return num.split('').join(' ');
}

/**
 * Populate the draw date dropdown with available dates from lotteryResults
 */
function populateDrawDateDropdown() {
    const dropdown = document.getElementById('draw-date');
    
    if (!dropdown) {
        console.error('Draw date dropdown not found');
        return;
    }
    
    // Check if lotteryResults is available
    if (typeof lotteryResults === 'undefined' || !lotteryResults) {
        console.error('lotteryResults is not available');
        return;
    }
    
    // Clear existing options except the first placeholder
    dropdown.innerHTML = '<option value="">Select a Draw Date</option>';
    
    // Add an option for each lottery draw
    lotteryResults.forEach(function(draw) {
        const option = document.createElement('option');
        option.value = draw.date;
        option.textContent = draw.dateDisplay;
        dropdown.appendChild(option);
    });
}

/**
 * Setup the form submit handler for checking lottery numbers
 */
function setupFormSubmitHandler() {
    const form = document.getElementById('check-form');
    
    if (!form) {
        console.error('Check form not found');
        return;
    }
    
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form from submitting normally
        checkUserTicket();
    });
}

/**
 * Check the user's ticket number against the selected draw
 */
function checkUserTicket() {
    const ticketInput = document.getElementById('user-ticket');
    const dateSelect = document.getElementById('draw-date');
    const resultDiv = document.getElementById('check-result');
    
    // Get and validate input values
    const ticketNumber = ticketInput.value.trim();
    const selectedDate = dateSelect.value;
    
    // Validate ticket number
    if (!ticketNumber || ticketNumber.length !== 6 || !/^\d{6}$/.test(ticketNumber)) {
        showResult('Please enter a valid 6-digit number.', 'error');
        return;
    }
    
    // Validate draw date selection
    if (!selectedDate) {
        showResult('Please select a draw date.', 'error');
        return;
    }
    
    // Find the selected draw
    const selectedDraw = lotteryResults.find(function(draw) {
        return draw.date === selectedDate;
    });
    
    if (!selectedDraw) {
        showResult('Selected draw not found.', 'error');
        return;
    }
    
    // Check for winning matches
    const wins = checkForWin(ticketNumber, selectedDraw);
    
    // Display the result
    if (wins.length > 0) {
        let winMessage = '🎉 Congratulations! You won the following prize(s):<ul>';
        wins.forEach(function(win) {
            winMessage += `<li>${win}</li>`;
        });
        winMessage += '</ul>';
        showResult(winMessage, 'win');
    } else {
        showResult('Sorry, your number did not match any winning numbers for this draw.', 'lose');
    }
}

/**
 * Check if the ticket number matches any winning numbers
 * @param {string} ticketNumber - The 6-digit ticket number
 * @param {object} draw - The lottery draw object to check against
 * @returns {string[]} Array of prize type strings for each match
 */
function checkForWin(ticketNumber, draw) {
    const wins = [];

    // Check First Prize (exact match)
    if (ticketNumber === draw.firstPrize) {
        wins.push('First Prize (รางวัลที่ 1) - 6 Million Baht!');
    }
    
    // Check First Prize Neighbors (+/- 1)
    const neighbors = getNeighbors(draw.firstPrize);
    if (neighbors.includes(ticketNumber)) {
        wins.push('First Prize Neighbor (รางวัลข้างเคียงรางวัลที่ 1) - 100,000 Baht');
    }

    // Check Last Two Digits
    const lastTwo = ticketNumber.substring(4, 6);
    if (lastTwo === draw.twoDigit) {
        wins.push('Last Two Digits (รางวัลเลขท้าย 2 ตัว) - 2,000 Baht');
    }
    
    // Check First Three Digits
    const firstThree = ticketNumber.substring(0, 3);
    if (draw.threeDigitFront.includes(firstThree)) {
        wins.push('First Three Digits (รางวัลเลขหน้า 3 ตัว) - 4,000 Baht');
    }
    
    // Check Last Three Digits
    const lastThree = ticketNumber.substring(3, 6);
    if (draw.threeDigitBack.includes(lastThree)) {
        wins.push('Last Three Digits (รางวัลเลขท้าย 3 ตัว) - 4,000 Baht');
    }
    
    return wins;
}

/**
 * Calculate the neighbors (+/- 1) of a 6-digit lottery number
 * @param {string} firstPrize - The 6-digit first prize number
 * @returns {string[]} Array of two neighbor strings
 */
function getNeighbors(firstPrize) {
    const num = parseInt(firstPrize, 10);
    const n1 = (num - 1 + 1000000) % 1000000;
    const n2 = (num + 1) % 1000000;
    
    // Pad back to 6 digits
    return [
        n1.toString().padStart(6, '0'),
        n2.toString().padStart(6, '0')
    ];
}

/**
 * Display a result message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('win', 'lose', or 'error')
 */
function showResult(message, type) {
    const resultDiv = document.getElementById('check-result');
    
    if (!resultDiv) {
        console.error('Result div not found');
        return;
    }
    
    // Create the result HTML
    // Using role="status" with aria-live="polite" for non-urgent announcements
    const resultHTML = `<p class="${type}" role="status" aria-live="polite" aria-atomic="true">${message}</p>`;
    
    resultDiv.innerHTML = resultHTML;
    
    // Scroll to result for better UX
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}