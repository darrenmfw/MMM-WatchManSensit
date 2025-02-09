# MMM-WatchManSensit v1.0.0 Release Notes

**Release Date:** February 2025

## Overview
MMM-WatchManSensit v1.0.0 is the first stable release of this MagicMirror² module that integrates with the Kingspan Watchman SENSiT service. The module communicates with the service via SOAP requests, retrieves live tank data—including the fill level, last reading timestamp, and expected empty (run-out) date—and displays it on your MagicMirror in a clear, visually appealing format.

## New Features
- **SOAP-Based Communication:**
  - Authenticates and retrieves tank data from the Connect Sensor service using SOAP requests.
  - Uses a single `serialNumber` configuration parameter to construct the user ID (by prepending "BOX") and as the signalman number.
- **Live Data Display:**
  - Displays the current fill level (e.g., "75%") of the tank.
  - Shows the "Last reading" timestamp, formatted to exclude seconds and with a two-digit year.
  - Presents the "Expected empty" date as a date-only value with a two-digit year.
- **Customizable User Interface:**
  - Configurable tank name via the `tankName` setting appears at the top of the module.
  - All labels are rendered in grey while the dynamic data (values) are shown in white.
- **Robust XML Parsing:**
  - Utilizes the `xml2js` library with namespace stripping to reliably parse the SOAP XML responses.
  - Provides fallback handling for cases where the primary data is missing.
- **Configurable Update Interval:**
  - The module periodically updates the data at a user-defined interval. The default is set to update once per hour (3600000 milliseconds).

## Configuration Example
Add the following configuration to your MagicMirror `config/config.js` file:

```js
{
  module: "MMM-WatchManSensit",
  position: "top_right",
  config: {
    updateInterval: 3600000,      // Update every 3600000 milliseconds (1 hour).
    serialNumber: "12345678",       // Your device's serial number (without the "BOX" prefix).
    password: "Password1!",         // Your password.
    culture: "en",                // Culture/language parameter.
    tankName: "My Tank"           // Display name for your tank.
  }
}
```

## Known Limitations & Future Enhancements
- **Multi-Tank Support:**  
  Currently, the module is designed for a single tank. Future updates may add support for multiple tanks if the API response provides an array of tank data.
- **UI Customization:**  
  Additional styling options and custom layouts may be incorporated in future releases.
- **Enhanced Error Reporting:**  
  Future versions may include more detailed error messages and recovery options.

## Conclusion
MMM-WatchManSensit v1.0.0 delivers a straightforward and visually appealing integration for displaying Kingspan Watchman SENSiT tank data on your MagicMirror. We welcome feedback and suggestions for future enhancements.

Enjoy using MMM-WatchManSensit!
