# MMM-WatchManSensit

A MagicMirror² module that integrates with the Kingspan WatchMan SENSiT service to display live tank data (via SOAP requests), including the latest reading and its timestamp.

> **Disclaimer:**  
> This module is based on reverse‑engineering the WatchMan SENSiT communication. It sends SOAP requests to the Connect Sensor service and parses the XML response to extract sensor data. The API endpoints, SOAP actions, and XML structure are based on observed traffic and may change over time. Use at your own risk.

## Features

- **Live Data Retrieval:**  
  Authenticates with the Connect Sensor service using SOAP and retrieves the latest tank level data.
- **Display:**  
  Shows the fill level, the last reading timestamp, and the expected empty date.
- **Configurable:**  
  Easily update the credentials and SOAP parameters via the module configuration.

> **Note on Multi-Tank Support:**  
> Currently, the module is set up to extract data for a single tank from the SOAP response. If your installation supports multiple tanks, you will need to modify the NodeHelper XML parsing code and the front-end display logic to loop through and display all available tanks.

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
   This installs the [xml2js](https://www.npmjs.com/package/xml2js) library, which is used to parse the SOAP XML responses.

3. **Configure the Module**

   Open your MagicMirror configuration file (`config/config.js`) in your favorite text editor and add the following entry to the `modules` array:
   ```js
   {
     module: "MMM-WatchManSensit",
     position: "top_right", // Change this to your preferred location.
     config: {
       updateInterval: 60000, // Update every 60 seconds.
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
   The NodeHelper constructs a SOAP XML envelope using the provided configuration. The user ID is built as "BOX" concatenated with the serial number, and the signalman number is the serial number itself. The request is sent as a POST to:
   ```
   https://www.connectsensor.com/soap/MobileApp.asmx
   ```
   with the SOAPAction `"http://mobileapp/SoapMobileAPPGetLatestLevel_v3"`.

2. **XML Response Parsing:**  
   The response (an XML SOAP envelope) is parsed using the xml2js library with namespace prefixes stripped. The module navigates the XML structure to extract key data such as `<LevelPercentage>`, `<ReadingDate>`, and `<RunOutDate>` from the `<Level>` element. The reading date is formatted without seconds, and the run out date is formatted to display only the date.

3. **Display:**  
   The front-end module receives the parsed data via a socket notification and updates the display to show:
   - The tank name (from configuration) at the top.
   - "Fill level:" followed by the percentage (e.g., "75%").
   - "Last reading:" with the formatted reading date.
   - "Expected empty:" with the formatted run out date.

## Repository

The source code for this module is hosted on GitHub:  
[https://github.com/darrenmfw/MMM-WatchManSensit](https://github.com/darrenmfw/MMM-WatchManSensit)

## License

This project is licensed under the MIT License.
