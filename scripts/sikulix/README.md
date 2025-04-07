# SikuliX Integration for Davide Roulette

This directory contains the SikuliX scripts and image assets used to automate interactions with the PlanetWin365 casino site.

## Requirements

- SikuliX 2.0.5 or later (https://sikulix.github.io/)
- Java Runtime Environment (JRE) 8 or later
- Chrome browser installed

## Directory Structure

```
sikulix/
├── images/                # Reference images for visual recognition
│   ├── planetwin_logo.png # Site logo for verification
│   ├── login_button.png   # Login button image
│   ├── username_field.png # Username field image
│   └── ...                # Other recognition images
├── PlanetWin365Bot.js     # Main SikuliX JavaScript automation script
└── README.md              # This documentation file
```

## Setup Instructions

1. **Install SikuliX**:
   - Download and install SikuliX from https://sikulix.github.io/
   - Make sure to install the JavaScript API support

2. **Set up Image References**:
   - Launch the PlanetWin365 site
   - Use SikuliX IDE to capture reference images of UI elements
   - Save the images to the `images/` directory

3. **Environment Variables**:
   For security, set up these environment variables:
   ```
   CASINO_USERNAME=your_username
   CASINO_PASSWORD=your_password
   ```

## Running the Bot

### Manual Execution

To run the bot manually for testing:

```bash
java -jar sikulix.jar -r PlanetWin365Bot.js -- "username" "password" '{"type":"martingala","initialBet":5,"maxLosses":6,"betType":"color","targetProfit":100,"stopLoss":50}'
```

### API Integration

The bot is designed to be launched from the web application via the SikuliXConnector module, which handles:

1. Starting the SikuliX process with appropriate arguments
2. Receiving and processing results
3. Monitoring logs and errors

## Troubleshooting

### Common Issues

1. **Image Recognition Failures**:
   - Make sure your screen resolution matches what was used to capture reference images
   - Update reference images if the casino website UI changes
   - Adjust the similarity threshold if needed

2. **Process Communication Issues**:
   - Check that the SikuliX process is properly receiving parameters
   - Verify log output for any Java exceptions

### Debugging

- Enable detailed logging by modifying the `logMessage()` function
- Use the `takeScreenshot()` function to capture the screen state when issues occur
- Check the stderr output from the SikuliX process

## Security Considerations

- Never hardcode credentials in the script
- Use environment variables or secure parameter passing
- Be aware that the script will visibly type passwords on screen
- Consider using a dedicated machine for running the bot

## Disclaimer

This automation is intended for demonstration and educational purposes only. Using bots on casino sites may violate their terms of service. Use responsibly and at your own risk.
