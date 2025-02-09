# MMM-WatchManSensit v1.0.1 Release Notes

**Release Date:** February 2025

## Overview
MMM-WatchManSensit v1.0.1 is a minor update to the stable v1.0.0 release. In this version, the only change is that the default update interval has been increased from 1 minute (60000 milliseconds) to 1 hour (3600000 milliseconds). This change helps reduce the frequency of API calls and conserves system resources while maintaining all existing functionality.

## New Feature
- **Default Update Interval Changed:**
  - **Previous Default:** 60000 milliseconds (1 minute)
  - **New Default:** 3600000 milliseconds (1 hour)

## Features
- **SOAP-Based Communication:**  
  Authenticates with the Connect Sensor service using SOAP and retrieves live tank data.
- **Live Data Display:**  
  Displays the fill level, the last reading timestamp (labeled as "Last reading:" and formatted without seconds), and the expected empty date (labeled as "Expected empty:" and showing only the date with a 2-digit year).
- **Customizable Interface:**  
  The module allows you to set a custom tank name (via the `tankName` setting) which appears at the top of the display. All labels appear in grey while the dynamic data (values) are shown in white.
- **Robust XML Parsing:**  
  Utilizes the `xml2js` library with namespace stripping to reliably parse SOAP XML responses.
- **Configurable Update Interval:**  
  The module periodically updates the data at the configured interval. The default has been updated to 1 hour in this release.

## Requirements
- [MagicMirror²](https://magicmirror.builders/)
- Node.js (included with the MagicMirror installation)
- Internet connectivity to access the Connect Sensor SOAP service

## Installation

1. **Clone the Repository**

   Open a terminal and navigate to your MagicMirror modules directory:
   ```bash
   cd ~/MagicMirror/modules
   ```
   Then clone the repository:
   ```bash
   git clone https://github.com/darrenmfw/MMM-WatchManSensit.git
   ```

2. **Install Dependencies**

   Navigate to the module folder and install the XML parser dependency:
   ```bash
   cd ~/MagicMirror/modules/MMM-WatchManSensit
   npm install xml2js
   ```
   This installs the [xml2js](https://www.npmjs.com/package/xml2js) library, which is used to parse SOAP XML responses.

3. **Configure the Module**

   Open your MagicMirror configuration file (`config/config.js`) in your favorite text editor and add the following entry to the `modules` array:
   ```js
   {
     module: "MMM-WatchManSensit",
     position: "top_right", // Change this to your preferred location.
     config: {
       updateInterval: 3600000, // Update every 1 hour.
       serialNumber: "12345678", // Example serial number.
       password: "Password1!",   // Example password.
       culture: "en",            // Culture/language parameter.
       tankName: "My Tank"       // Display name for your tank.
     }
   }
   ```

4. **Restart MagicMirror**

   Restart your MagicMirror instance so that the new module loads. For example, if you are using PM2:
   ```bash
   pm2 restart MagicMirror
   ```
   Alternatively, restart the MagicMirror service using your usual method.

## How It Works

1. **SOAP Request:**  
   The NodeHelper constructs a SOAP XML envelope using the provided configuration. The user ID is built as "BOX" concatenated with the serial number, and the signalman number is the serial number itself. The SOAP request is sent as a POST to:
   ```
   https://www.connectsensor.com/soap/MobileApp.asmx
   ```
   with the SOAPAction `"http://mobileapp/SoapMobileAPPGetLatestLevel_v3"`.

2. **XML Response Parsing:**  
   The response (an XML SOAP envelope) is parsed using the xml2js library with namespace prefixes stripped. The module navigates the XML structure to extract key data such as:
   - `<LevelPercentage>` for the fill level,
   - `<ReadingDate>` for the last reading timestamp (formatted without seconds, with a 2-digit year), and
   - `<RunOutDate>` for the expected empty date (formatted to display only the date with a 2-digit year).

3. **Display:**  
   The front-end module receives the parsed data via a socket notification and updates the display to show:
   - The tank name (from configuration) at the top,
   - "Fill level:" followed by the fill level (e.g., "75%"),
   - "Last reading:" with the formatted reading timestamp, and
   - "Expected empty:" with the formatted run out date.

## Repository

The source code for this module is hosted on GitHub:  
[https://github.com/darrenmfw/MMM-WatchManSensit](https://github.com/darrenmfw/MMM-WatchManSensit)

## License

This project is licensed under the MIT License.
