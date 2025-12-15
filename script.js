/**
 * Thai Lottery Checker - Main JavaScript File
 * This script handles all interactive features including:
 * - Displaying latest lottery results
 * - Populating draw date dropdown
 * - Validating user input
 * - Checking winning numbers
 * - Displaying results dynamically
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
}

/**
 * Display the latest lottery results on the page
 */
function displayLatestResults() {
    const resultsDisplay = document.getElementById('results-display');
    
    if (!lotteryResults || lotteryResults.length === 0) {
        resultsDisplay.innerHTML = '<p class="error">No lottery results available.</p>';
        return;
    }
    
    // Get the latest result (first in the array)
    const latest = lotteryResults[0];
    
    // Build the HTML for displaying results
    let html = `
        <div class="latest-result">
            <h3>Draw Date: ${latest.dateDisplay}</h3>
            <div class="prize-section">
                <h4>First Prize (รางวัลที่ 1)</h4>
                <p class="lottery-numbers">${formatNumber(latest.firstPrize)}</p>
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
    const result = checkForWin(ticketNumber, selectedDraw);
    
    // Display the result
    if (result.isWin) {
        showResult(`🎉 Congratulations! Your number matches: ${result.prizeType}`, 'win');
    } else {
        showResult('Sorry, your number did not match any winning numbers for this draw.', 'lose');
    }
}

/**
 * Check if the ticket number matches any winning numbers
 * @param {string} ticketNumber - The 6-digit ticket number
 * @param {object} draw - The lottery draw object to check against
 * @returns {object} Result object with isWin and prizeType properties
 */
function checkForWin(ticketNumber, draw) {
    // Check First Prize (exact match)
    if (ticketNumber === draw.firstPrize) {
        return {
            isWin: true,
            prizeType: 'First Prize (รางวัลที่ 1) - 6 Million Baht!'
        };
    }
    
    // Check Last Two Digits
    const lastTwo = ticketNumber.substring(4, 6);
    if (lastTwo === draw.twoDigit) {
        return {
            isWin: true,
            prizeType: 'Last Two Digits (รางวัลเลขท้าย 2 ตัว) - 2,000 Baht'
        };
    }
    
    // Check First Three Digits
    const firstThree = ticketNumber.substring(0, 3);
    if (draw.threeDigitFront.includes(firstThree)) {
        return {
            isWin: true,
            prizeType: 'First Three Digits (รางวัลเลขหน้า 3 ตัว) - 4,000 Baht'
        };
    }
    
    // Check Last Three Digits
    const lastThree = ticketNumber.substring(3, 6);
    if (draw.threeDigitBack.includes(lastThree)) {
        return {
            isWin: true,
            prizeType: 'Last Three Digits (รางวัลเลขท้าย 3 ตัว) - 4,000 Baht'
        };
    }
    
    // No match found
    return {
        isWin: false,
        prizeType: null
    };
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
    const resultHTML = `<p class="${type}" role="alert" aria-live="polite">${message}</p>`;
    
    resultDiv.innerHTML = resultHTML;
    
    // Scroll to result for better UX
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}