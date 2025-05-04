// Get DOM Elements
const passwordOutput = document.getElementById('passwordOutput');
const copyButton = document.getElementById('copyButton');
const lengthInput = document.getElementById('lengthInput');
const includeUppercase = document.getElementById('includeUppercase');
const includeLowercase = document.getElementById('includeLowercase');
const includeNumbers = document.getElementById('includeNumbers');
const includeSymbols = document.getElementById('includeSymbols');
const generateButton = document.getElementById('generateButton');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
// If using an image in the copy button, you might want to get it too if you change its src
const copyButtonImage = copyButton.querySelector('img'); // Get the image inside the button


// Character Sets
const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+[]{}|;:,.<>?';

// --- Event Listeners ---

generateButton.addEventListener('click', () => {
    const length = +lengthInput.value; // Get length as a number
    const useUpper = includeUppercase.checked;
    const useLower = includeLowercase.checked;
    const useNumbers = includeNumbers.checked;
    const useSymbols = includeSymbols.checked;

    const password = generatePassword(length, useUpper, useLower, useNumbers, useSymbols);
    passwordOutput.value = password;
    updateStrengthIndicator(password, useUpper, useLower, useNumbers, useSymbols);
});

copyButton.addEventListener('click', () => {
    copyPassword();
});

// Add event listeners to options to update strength indicator dynamically (optional but good UX)
lengthInput.addEventListener('input', updateOptions);
includeUppercase.addEventListener('change', updateOptions);
includeLowercase.addEventListener('change', updateOptions);
includeNumbers.addEventListener('change', updateOptions);
includeSymbols.addEventListener('change', updateOptions);

// --- Functions ---

function generatePassword(length, upper, lower, numbers, symbols) {
    let allowedChars = '';
    let password = '';

    // Build the string of allowed characters
    if (upper) allowedChars += uppercaseChars;
    if (lower) allowedChars += lowercaseChars;
    if (numbers) allowedChars += numberChars;
    if (symbols) allowedChars += symbolChars;

    // Ensure at least one character type is selected
    if (allowedChars.length === 0) {
        // Instead of alert, maybe disable generate button or show message on page
        strengthText.textContent = 'Please select character types!';
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#e0e0e0';
        return ''; // Return empty if no types selected
    }

     // Ensure the password contains at least one of each selected character type (optional but stronger)
     let guaranteedChars = [];
     if (upper) guaranteedChars.push(getRandomChar(uppercaseChars));
     if (lower) guaranteedChars.push(getRandomChar(lowercaseChars));
     if (numbers) guaranteedChars.push(getRandomChar(numberChars));
     if (symbols) guaranteedChars.push(getRandomChar(symbolChars));

     // Fill the rest of the password length with random characters from the allowed set
     const remainingLength = length - guaranteedChars.length;
     for (let i = 0; i < remainingLength; i++) {
         // Prevent issues if length is less than the number of guaranteed types
         if (password.length + guaranteedChars.length < length) {
            password += getRandomChar(allowedChars);
         }
     }

     // Combine guaranteed characters with the random part and shuffle
     let combinedPassword = shuffleString(password + guaranteedChars.join(''));

     // Trim if the guaranteed chars made it longer than requested (can happen if length < number of selected types)
     return combinedPassword.slice(0, length);

}

function getRandomChar(charSet) {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    return charSet[randomIndex];
}

// Fisher-Yates (Knuth) Shuffle algorithm for better randomness
function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr.join('');
}


function copyPassword() {
    if (!passwordOutput.value) return; // Don't copy if empty

    passwordOutput.select(); // Select the text
    passwordOutput.setSelectionRange(0, 99999); // For mobile devices

    try {
        navigator.clipboard.writeText(passwordOutput.value)
            .then(() => {
                // --- Visual feedback for copy ---
                const originalButtonContent = copyButton.innerHTML; // Store original HTML
                copyButton.textContent = 'Copied!'; // Change button text only
                copyButton.style.backgroundColor = '#28a745'; // Green background
                copyButton.disabled = true; // Disable button briefly

                setTimeout(() => {
                    copyButton.innerHTML = originalButtonContent; // Restore original HTML (including image if present)
                    copyButton.style.backgroundColor = '#007bff'; // Restore original color
                    copyButton.disabled = false; // Re-enable button
                }, 1500); // Restore after 1.5 seconds
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Could not copy password to clipboard.'); // Use alert as fallback feedback
            });
    } catch (err) {
        // Fallback for older browsers or environments where clipboard API might fail (e.g., insecure context)
        console.warn('navigator.clipboard API failed, trying execCommand fallback.');
         try {
            const successful = document.execCommand('copy');
            if (successful) {
                const originalButtonContent = copyButton.innerHTML;
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#28a745';
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.innerHTML = originalButtonContent;
                    copyButton.style.backgroundColor = '#007bff';
                    copyButton.disabled = false;
                }, 1500);
            } else {
                 alert('Could not copy password (fallback failed).');
            }
         } catch (execErr) {
            console.error('Fallback copy failed: ', execErr);
            alert('Could not copy password.');
         }
    }
}


function updateStrengthIndicator(password, hasUpper, hasLower, hasNumbers, hasSymbols) {
    let score = 0;
    const length = password.length;

    if (!password) {
        strengthBar.style.width = '0%';
        // Don't clear text if it's showing an error message from generatePassword
        if (strengthText.textContent !== 'Please select character types!') {
            strengthText.textContent = '';
        }
        strengthBar.style.backgroundColor = '#e0e0e0'; // Reset bar color
        return;
    }

    // --- Basic Strength Score Calculation ---
    // 1. Length Score
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;

    // 2. Character Type Score - Check if the *generated* password actually contains them
    let typesCount = 0;
    if (hasUpper && /[A-Z]/.test(password)) { score += 1; typesCount++; }
    if (hasLower && /[a-z]/.test(password)) { score += 1; typesCount++; }
    if (hasNumbers && /[0-9]/.test(password)) { score += 1; typesCount++; }
    // Escape special regex characters in the symbol string
    const escapedSymbolChars = symbolChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const symbolRegex = new RegExp(`[${escapedSymbolChars}]`);
    if (hasSymbols && symbolRegex.test(password)) { score += 1; typesCount++; }

    // Bonus for using multiple character types (more reliable to check count)
    if (typesCount >= 3) score += 1; // Bonus for 3 types
    if (typesCount === 4) score += 1; // Additional bonus for all 4 types

    // --- Update Bar and Text ---
    // Adjust max score based on your criteria (e.g., 3 length + 4 types + 2 bonus = 9)
    const maxScore = 9;
    const strengthPercentage = Math.min(100, Math.max(0, (score / maxScore) * 100)); // Ensure percentage is between 0 and 100

    strengthBar.style.width = `${strengthPercentage}%`;

    // Determine strength level based on score
    if (score <= 2) {
        strengthText.textContent = 'Weak';
        strengthBar.style.backgroundColor = '#dc3545'; // Red
    } else if (score <= 4) {
        strengthText.textContent = 'Medium';
        strengthBar.style.backgroundColor = '#ffc107'; // Yellow
    } else if (score <= 7) { // Adjusted threshold
         strengthText.textContent = 'Strong';
         strengthBar.style.backgroundColor = '#28a745'; // Light Green
    } else { // Score 8 or 9
        strengthText.textContent = 'Very Strong';
        strengthBar.style.backgroundColor = '#1a682b'; // Darker Green
    }
}

// Function to update strength based on *options* (called when options change)
function updateOptions() {
    const length = +lengthInput.value;
    const useUpper = includeUppercase.checked;
    const useLower = includeLowercase.checked;
    const useNumbers = includeNumbers.checked;
    const useSymbols = includeSymbols.checked;

    // Check if any character type is selected
    if (!useUpper && !useLower && !useNumbers && !useSymbols) {
        strengthText.textContent = 'Please select character types!';
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#e0e0e0';
         // Maybe disable generate button if needed
        // generateButton.disabled = true;
        return; // Stop further processing
    } else {
         // Re-enable generate button if it was disabled
         // generateButton.disabled = false;
         // Clear the specific error message if it was shown
         if (strengthText.textContent === 'Please select character types!') {
             strengthText.textContent = '';
         }
    }


    // Estimate strength based on *selected options* and length
    // Create a *dummy* score calculation based on selected options, not a generated password
    let estimatedScore = 0;
    let typesSelectedCount = 0;

    // Length Score
    if (length >= 8) estimatedScore += 1;
    if (length >= 12) estimatedScore += 1;
    if (length >= 16) estimatedScore += 1;

    // Character Type Score (based on selection)
    if (useUpper) { estimatedScore += 1; typesSelectedCount++; }
    if (useLower) { estimatedScore += 1; typesSelectedCount++; }
    if (useNumbers) { estimatedScore += 1; typesSelectedCount++; }
    if (useSymbols) { estimatedScore += 1; typesSelectedCount++; }

    // Bonus for selecting multiple types
    if (typesSelectedCount >= 3) estimatedScore += 1;
    if (typesSelectedCount === 4) estimatedScore += 1;

     // Update Bar and Text using the estimated score
     const maxScore = 9; // Same max score as before
     const strengthPercentage = Math.min(100, Math.max(0, (estimatedScore / maxScore) * 100));

     strengthBar.style.width = `${strengthPercentage}%`;

     if (estimatedScore <= 2) {
        // Don't override error message if present
        if (strengthText.textContent !== 'Please select character types!') strengthText.textContent = 'Weak (Potential)';
        strengthBar.style.backgroundColor = '#dc3545'; // Red
    } else if (estimatedScore <= 4) {
        if (strengthText.textContent !== 'Please select character types!') strengthText.textContent = 'Medium (Potential)';
        strengthBar.style.backgroundColor = '#ffc107'; // Yellow
    } else if (estimatedScore <= 7) {
        if (strengthText.textContent !== 'Please select character types!') strengthText.textContent = 'Strong (Potential)';
        strengthBar.style.backgroundColor = '#28a745'; // Light Green
    } else {
        if (strengthText.textContent !== 'Please select character types!') strengthText.textContent = 'Very Strong (Potential)';
        strengthBar.style.backgroundColor = '#1a682b'; // Darker Green
    }

     // If a password already exists in the output, re-evaluate its *actual* strength
     if (passwordOutput.value) {
         updateStrengthIndicator(passwordOutput.value,
             /[A-Z]/.test(passwordOutput.value),
             /[a-z]/.test(passwordOutput.value),
             /[0-9]/.test(passwordOutput.value),
             symbolRegex.test(passwordOutput.value) // Use the regex defined earlier
         );
     }
}


// Initial strength check on page load (based on default settings)
updateOptions();