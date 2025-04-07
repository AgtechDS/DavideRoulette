/**
 * PlanetWin365Bot.js
 * 
 * This script is designed to be executed with the SikuliX JavaScript API.
 * It automates the process of logging into PlanetWin365, navigating to the roulette game,
 * and placing bets according to the specified strategy.
 * 
 * To run this script:
 * 1. Install SikuliX (v2.0.5 or later)
 * 2. Place this script and the associated image folder in your SikuliX scripts directory
 * 3. Run using: java -jar sikulix.jar -r PlanetWin365Bot.js -- [arguments]
 */

// Import SikuliX JavaScript API
var Settings = Java.type('org.sikuli.basics.Settings');
var Screen = Java.type('org.sikuli.script.Screen');
var Pattern = Java.type('org.sikuli.script.Pattern');
var App = Java.type('org.sikuli.script.App');
var Key = Java.type('org.sikuli.script.Key');
var Mouse = Java.type('org.sikuli.script.Mouse');
var Button = Java.type('org.sikuli.script.Button');
var Location = Java.type('org.sikuli.script.Location');

// Configure SikuliX settings
Settings.AutoWaitTimeout = 20; // 20 seconds timeout for finding images
Settings.MoveMouseDelay = 0.5; // Slow down mouse movements for stability

// Initialize the screen
var screen = new Screen();

// Path to image assets folder
var IMAGES_PATH = "./images/";

// User credentials (passed as arguments or set here)
var USERNAME = arguments[0] || "Dinquart84";
var PASSWORD = arguments[1] || ""; // Do not hardcode the password

// Strategy settings (can be passed as JSON in arguments)
var strategy = {
    type: "martingala",
    initialBet: 5,
    maxLosses: 6,
    betType: "color",
    targetProfit: 100,
    stopLoss: 50
};

// Try to parse strategy from arguments if provided
if (arguments.length > 2) {
    try {
        strategy = JSON.parse(arguments[2]);
    } catch (e) {
        console.error("Failed to parse strategy JSON:", e);
    }
}

// Current session state
var sessionState = {
    balance: 0,
    currentBet: strategy.initialBet,
    betsPlaced: 0,
    wins: 0,
    losses: 0,
    consecutiveLosses: 0,
    profit: 0,
    lastResults: []
};

/**
 * Main execution function
 */
function main() {
    try {
        // Log start of execution
        logMessage("info", "Starting PlanetWin365 bot with " + strategy.type + " strategy");
        
        // Launch browser and navigate to PlanetWin365
        openBrowser();
        
        // Login to the casino
        login(USERNAME, PASSWORD);
        
        // Navigate to the roulette game
        navigateToRoulette();
        
        // Read initial balance
        readBalance();
        
        // Main betting loop
        startBettingCycle();
        
    } catch (e) {
        logMessage("error", "Error in main execution: " + e);
        takeScreenshot("error_screenshot.png");
    } finally {
        // Send final report
        sendFinalReport();
    }
}

/**
 * Open the browser and navigate to PlanetWin365
 */
function openBrowser() {
    logMessage("info", "Opening browser and navigating to PlanetWin365...");
    
    try {
        // Try to open Chrome 
        App.open("chrome");
        wait(2.0);
        
        // Type the URL
        screen.type("l", Key.CTRL); // Focus address bar
        wait(0.5);
        screen.type("https://www.planetwin365.it/it/casino/\n");
        wait(5.0);
        
        // Wait for the site to load by looking for the logo
        if (screen.exists(IMAGES_PATH + "planetwin_logo.png")) {
            logMessage("info", "Successfully loaded PlanetWin365 website");
        } else {
            logMessage("warning", "Website logo not found, but continuing...");
        }
    } catch (e) {
        logMessage("error", "Failed to open browser: " + e);
        throw e;
    }
}

/**
 * Login to PlanetWin365
 */
function login(username, password) {
    logMessage("info", "Attempting to login...");
    
    try {
        // Find and click the login button
        if (screen.exists(IMAGES_PATH + "login_button.png")) {
            screen.click(IMAGES_PATH + "login_button.png");
            wait(1.0);
        }
        
        // Enter username
        if (screen.exists(IMAGES_PATH + "username_field.png")) {
            screen.click(IMAGES_PATH + "username_field.png");
            screen.type(username);
        }
        
        // Enter password
        if (screen.exists(IMAGES_PATH + "password_field.png")) {
            screen.click(IMAGES_PATH + "password_field.png");
            screen.type(password);
        }
        
        // Click login submit
        if (screen.exists(IMAGES_PATH + "submit_login.png")) {
            screen.click(IMAGES_PATH + "submit_login.png");
            wait(3.0);
        }
        
        // Verify login success
        if (screen.exists(IMAGES_PATH + "logged_in_indicator.png")) {
            logMessage("info", "Login successful");
        } else {
            logMessage("warning", "Login indicator not found. May need to check if login was successful.");
        }
    } catch (e) {
        logMessage("error", "Login failed: " + e);
        throw e;
    }
}

/**
 * Navigate to the roulette game
 */
function navigateToRoulette() {
    logMessage("info", "Navigating to the roulette game...");
    
    try {
        // Click on the Casino section
        if (screen.exists(IMAGES_PATH + "casino_button.png")) {
            screen.click(IMAGES_PATH + "casino_button.png");
            wait(2.0);
        }
        
        // Search for "roulette"
        if (screen.exists(IMAGES_PATH + "search_games.png")) {
            screen.click(IMAGES_PATH + "search_games.png");
            screen.type("roulette\n");
            wait(2.0);
        }
        
        // Click on the desired roulette game
        if (screen.exists(IMAGES_PATH + "roulette_game.png")) {
            screen.click(IMAGES_PATH + "roulette_game.png");
            wait(5.0);
        }
        
        // Wait for the game to fully load
        wait(10.0);
        
        logMessage("info", "Successfully navigated to roulette game");
    } catch (e) {
        logMessage("error", "Failed to navigate to roulette: " + e);
        throw e;
    }
}

/**
 * Read current balance
 */
function readBalance() {
    try {
        if (screen.exists(IMAGES_PATH + "balance_area.png")) {
            // This is a placeholder for OCR functionality
            // In a real implementation, we would use OCR to read the balance value
            
            // For demonstration, we'll assume a starting balance
            sessionState.balance = 100.00;
            logMessage("info", "Current balance: €" + sessionState.balance.toFixed(2));
        } else {
            logMessage("warning", "Could not find balance display");
        }
    } catch (e) {
        logMessage("error", "Failed to read balance: " + e);
    }
}

/**
 * Start the betting cycle
 */
function startBettingCycle() {
    logMessage("info", "Starting betting cycle with " + strategy.type + " strategy");
    
    // Main betting loop
    while (shouldContinueBetting()) {
        try {
            // Wait for betting phase
            waitForBettingPhase();
            
            // Place bet based on strategy
            placeBet();
            
            // Wait for result
            var result = waitForResult();
            
            // Process result
            processResult(result);
            
            // Check if we need to adjust bet amount for next round
            adjustBetAmount(result);
            
            // Short pause between rounds
            wait(2.0);
            
        } catch (e) {
            logMessage("error", "Error in betting cycle: " + e);
            takeScreenshot("error_betting_cycle.png");
            
            // Wait a bit before continuing
            wait(5.0);
        }
    }
    
    logMessage("info", "Betting cycle completed");
}

/**
 * Check if we should continue betting based on strategy conditions
 */
function shouldContinueBetting() {
    // Check if we've reached target profit
    if (sessionState.profit >= strategy.targetProfit) {
        logMessage("success", "Target profit reached! Stopping bot.");
        return false;
    }
    
    // Check if we've hit stop loss
    if (sessionState.profit <= -strategy.stopLoss) {
        logMessage("warning", "Stop loss hit! Stopping bot.");
        return false;
    }
    
    // Check if we've hit max consecutive losses
    if (sessionState.consecutiveLosses >= strategy.maxLosses) {
        logMessage("warning", "Maximum consecutive losses reached! Stopping bot.");
        return false;
    }
    
    return true;
}

/**
 * Wait for the betting phase to begin
 */
function waitForBettingPhase() {
    logMessage("info", "Waiting for betting phase...");
    
    try {
        // Look for "Place your bets" indicator
        var timeout = 0;
        while (!screen.exists(IMAGES_PATH + "place_bets_indicator.png") && timeout < 60) {
            wait(1.0);
            timeout++;
        }
        
        if (timeout >= 60) {
            logMessage("warning", "Timed out waiting for betting phase");
        } else {
            logMessage("info", "Betting phase started");
        }
    } catch (e) {
        logMessage("error", "Error waiting for betting phase: " + e);
        throw e;
    }
}

/**
 * Place a bet based on the current strategy
 */
function placeBet() {
    logMessage("info", "Placing bet: €" + sessionState.currentBet.toFixed(2) + " on " + 
               (strategy.betType === "color" ? "color" : "even/odd"));
    
    try {
        // Select chip value closest to our current bet
        selectChipValue(sessionState.currentBet);
        
        // Place bet based on bet type
        if (strategy.betType === "color") {
            // Alternate between red and black
            var betOnRed = (sessionState.betsPlaced % 2 === 0);
            
            if (betOnRed) {
                screen.click(IMAGES_PATH + "red_betting_area.png");
                logMessage("info", "Bet placed on RED");
            } else {
                screen.click(IMAGES_PATH + "black_betting_area.png");
                logMessage("info", "Bet placed on BLACK");
            }
        } else {
            // Even/Odd betting
            var betOnEven = (sessionState.betsPlaced % 2 === 0);
            
            if (betOnEven) {
                screen.click(IMAGES_PATH + "even_betting_area.png");
                logMessage("info", "Bet placed on EVEN");
            } else {
                screen.click(IMAGES_PATH + "odd_betting_area.png");
                logMessage("info", "Bet placed on ODD");
            }
        }
        
        // Update state
        sessionState.betsPlaced++;
        
    } catch (e) {
        logMessage("error", "Failed to place bet: " + e);
        throw e;
    }
}

/**
 * Select the appropriate chip value
 */
function selectChipValue(targetAmount) {
    try {
        // This is a simplified implementation
        // In a real scenario, we would need to find the closest chip value to our target
        
        if (targetAmount <= 1) {
            screen.click(IMAGES_PATH + "chip_1.png");
        } else if (targetAmount <= 5) {
            screen.click(IMAGES_PATH + "chip_5.png");
        } else if (targetAmount <= 10) {
            screen.click(IMAGES_PATH + "chip_10.png");
        } else if (targetAmount <= 25) {
            screen.click(IMAGES_PATH + "chip_25.png");
        } else if (targetAmount <= 100) {
            screen.click(IMAGES_PATH + "chip_100.png");
        } else {
            screen.click(IMAGES_PATH + "chip_500.png");
        }
    } catch (e) {
        logMessage("error", "Failed to select chip value: " + e);
        throw e;
    }
}

/**
 * Wait for the result of the spin
 */
function waitForResult() {
    logMessage("info", "Waiting for roulette result...");
    
    try {
        // Wait for "No more bets" announcement
        var timeout = 0;
        while (!screen.exists(IMAGES_PATH + "no_more_bets.png") && timeout < 30) {
            wait(1.0);
            timeout++;
        }
        
        // Wait for the result display
        timeout = 0;
        while (!screen.exists(IMAGES_PATH + "result_shown.png") && timeout < 60) {
            wait(1.0);
            timeout++;
        }
        
        // Read the result (number and color)
        // This would use OCR in a real implementation
        
        // For demonstration, we'll generate a random result
        var number = Math.floor(Math.random() * 37); // 0-36
        var color;
        
        if (number === 0) {
            color = "green";
        } else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].indexOf(number) !== -1) {
            color = "red";
        } else {
            color = "black";
        }
        
        var isEven = (number !== 0) && (number % 2 === 0);
        
        logMessage("info", "Roulette result: " + number + " (" + color + ", " + (isEven ? "even" : "odd") + ")");
        
        return {
            number: number,
            color: color,
            isEven: isEven
        };
    } catch (e) {
        logMessage("error", "Error waiting for result: " + e);
        throw e;
    }
}

/**
 * Process the result of the spin
 */
function processResult(result) {
    try {
        var win = false;
        
        // Determine if we won based on our bet
        if (strategy.betType === "color") {
            // We alternate between red and black
            var betOnRed = ((sessionState.betsPlaced - 1) % 2 === 0);
            win = (betOnRed && result.color === "red") || (!betOnRed && result.color === "black");
        } else {
            // Even/Odd betting
            var betOnEven = ((sessionState.betsPlaced - 1) % 2 === 0);
            win = (betOnEven && result.isEven) || (!betOnEven && !result.isEven);
        }
        
        // Update session state
        if (win) {
            sessionState.wins++;
            sessionState.consecutiveLosses = 0;
            sessionState.profit += sessionState.currentBet;
            logMessage("success", "Bet WON! Profit: €" + sessionState.currentBet.toFixed(2));
        } else {
            sessionState.losses++;
            sessionState.consecutiveLosses++;
            sessionState.profit -= sessionState.currentBet;
            logMessage("warning", "Bet LOST! Loss: €" + sessionState.currentBet.toFixed(2));
        }
        
        // Update last results history
        sessionState.lastResults.push({
            number: result.number,
            color: result.color,
            isEven: result.isEven,
            betAmount: sessionState.currentBet,
            win: win
        });
        
        // Keep history at reasonable size
        if (sessionState.lastResults.length > 20) {
            sessionState.lastResults.shift();
        }
        
        // Send result to server
        sendResultToServer(result, win);
        
    } catch (e) {
        logMessage("error", "Error processing result: " + e);
    }
}

/**
 * Adjust bet amount based on strategy
 */
function adjustBetAmount(result) {
    try {
        var previousBet = sessionState.currentBet;
        
        // Apply strategy logic
        if (strategy.type === "martingala") {
            // Double bet after loss, reset after win
            if (sessionState.lastResults[sessionState.lastResults.length - 1].win) {
                sessionState.currentBet = strategy.initialBet;
            } else {
                sessionState.currentBet *= 2;
            }
        } else if (strategy.type === "fibonacci") {
            // Fibonacci progression: 1, 1, 2, 3, 5, 8, 13, 21, 34, ...
            if (sessionState.lastResults[sessionState.lastResults.length - 1].win) {
                // Go back two steps in the sequence or to the beginning
                sessionState.fibonacciIndex = Math.max(0, (sessionState.fibonacciIndex || 0) - 2);
                sessionState.currentBet = getFibonacciNumber(sessionState.fibonacciIndex) * strategy.initialBet;
            } else {
                // Move one step forward in the sequence
                sessionState.fibonacciIndex = (sessionState.fibonacciIndex || 0) + 1;
                sessionState.currentBet = getFibonacciNumber(sessionState.fibonacciIndex) * strategy.initialBet;
            }
        } else if (strategy.type === "dalembert") {
            // D'Alembert: increase by 1 unit after loss, decrease by 1 unit after win
            if (sessionState.lastResults[sessionState.lastResults.length - 1].win) {
                sessionState.currentBet = Math.max(strategy.initialBet, sessionState.currentBet - strategy.initialBet);
            } else {
                sessionState.currentBet += strategy.initialBet;
            }
        }
        
        logMessage("info", "Adjusted bet amount: €" + previousBet.toFixed(2) + " → €" + sessionState.currentBet.toFixed(2));
    } catch (e) {
        logMessage("error", "Error adjusting bet amount: " + e);
    }
}

/**
 * Calculate a Fibonacci number
 */
function getFibonacciNumber(n) {
    if (n <= 0) return 1;
    if (n === 1) return 1;
    
    var a = 1, b = 1;
    for (var i = 2; i <= n; i++) {
        var temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

/**
 * Send result to the server
 */
function sendResultToServer(result, win) {
    try {
        // This function would implement HTTP communication with the server
        // In this demo, we'll just log the intent
        
        var dataToSend = {
            time: new Date().toLocaleTimeString(),
            number: result.number,
            color: result.color.charAt(0).toUpperCase() + result.color.slice(1), // Capitalize
            betType: strategy.betType === "color" ? "Color" : "Even/Odd",
            betAmount: sessionState.currentBet,
            outcome: win ? "Win" : "Loss",
            profit: win ? sessionState.currentBet : undefined
        };
        
        logMessage("info", "Sending result to server: " + JSON.stringify(dataToSend));
        
        // In a real implementation, we would use HTTP requests to send this data to the server
        
    } catch (e) {
        logMessage("error", "Failed to send result to server: " + e);
    }
}

/**
 * Send final report to server
 */
function sendFinalReport() {
    try {
        var reportData = {
            sessionSummary: {
                betsPlaced: sessionState.betsPlaced,
                wins: sessionState.wins,
                losses: sessionState.losses,
                finalProfit: sessionState.profit,
                winRate: sessionState.betsPlaced > 0 ? (sessionState.wins / sessionState.betsPlaced) * 100 : 0
            },
            strategyUsed: strategy,
            endTime: new Date().toISOString()
        };
        
        logMessage("info", "Sending final report to server: " + JSON.stringify(reportData));
        
        // In a real implementation, we would use HTTP requests to send this data
        
    } catch (e) {
        logMessage("error", "Failed to send final report: " + e);
    }
}

/**
 * Take a screenshot for debugging
 */
function takeScreenshot(filename) {
    try {
        screen.capture().save(filename);
        logMessage("info", "Screenshot saved: " + filename);
    } catch (e) {
        logMessage("error", "Failed to take screenshot: " + e);
    }
}

/**
 * Log a message both to console and to be sent to server
 */
function logMessage(type, message) {
    var timestamp = new Date().toLocaleTimeString();
    var logLine = "[" + timestamp + "] [" + type + "] " + message;
    
    // Print to SikuliX console
    console.log(logLine);
    
    // In a real implementation, we would also send this log to the server
}

// Start the main execution
main();