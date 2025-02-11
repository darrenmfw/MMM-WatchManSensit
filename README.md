# MMM-WatchManSensit v1.1.1

**Release Date:** February 2025

## Overview
MMM-WatchManSensit v1.1.1 builds on previous releases by introducing enhanced multi‑tank support and new data lines. In this version, you can configure up to three tanks—each defined by a single serial number and a tank name. The module uses the serial number from the first tank (Tank 1) to construct the user ID (by prepending "BOX") for all SOAP requests, while each tank’s own serial number is used as its signalman number. **IMPORTANT:** The first tank's serial number MUST be the one from the first tank set up in the Watchman Connect app.

For each tank, the module retrieves and displays:
- **Fill level:** e.g. "85%"
- **Quantity remaining:** e.g. "2087 L"
- **Average use per day:** The consumption rate (appended with " L")
- **Last reading:** The timestamp when the tank was last read (formatted without seconds, with a 2‑digit year)
- **Expected empty:** The expected run‑out date (formatted as date-only with a 2‑digit year)

Conditional formatting is applied:
- Labels are grey.
- Data values are white unless:
  - The "Last reading" is over 48 hours old (displayed in red).
  - The "Expected empty" date is within 4 weeks (displayed in red).

Additionally, each tank configuration supports optional boolean flags to control the visibility of individual data lines.

## New Features
- **Multi-Tank Support:**  
  - Configure up to three tanks using a single serial number and tank name for each.
  - The module uses the first tank’s serial number (Tank 1) to build the user ID ("BOX" + Tank1.serialNumber) for all SOAP requests.
  - Each tank’s own serial number is used as its signalman number.
- **Additional Data Lines:**  
  - The SOAP response now includes `<LevelLitres>`, which is displayed as "Quantity remaining:".
  - A new data line displays `<ConsumptionRate>` as "Average use per day:" (with the value appended with " L").
- **Data Line Visibility Functionality:**  
  - Each tank configuration can include optional boolean flags:
    - `displayFillLevel` – shows/hides the "Fill level:" line.
    - `displayQuantityRemaining` – shows/hides the "Quantity remaining:" line.
    - `displayConsumption` – shows/hides the "Average use per day:" line.
    - `displayLastReading` – shows/hides the "Last reading:" line.
    - `displayExpectedEmpty` – shows/hides the "Expected empty:" line.
  - These flags default to true if not set.
- **SOAP-Based Data Retrieval:**  
  - Retrieves fill level, quantity remaining, consumption rate, last reading timestamp, and expected empty (run‑out) date for each tank.
- **Conditional UI Display:**  
  - Displays an error if a tank returns invalid data.
  - Tanks with a blank serial number are omitted.
- **Configurable Update Interval:**  
  - The module updates the data at a user-defined interval; the default is 1 hour.

## Requirements
- [MagicMirror²](https://magicmirror.builders/)
- Node.js (included with MagicMirror)
- Internet connectivity to access the Connect Sensor SOAP service
- **Important:** All tanks to be displayed on the module must be set up and working in the Watchman Connect app first.  
  Download the Watchman Connect app from the [Apple App Store](https://apps.apple.com/gb/app/watchman-connect/id1587348277) or the [Google Play Store](https://play.google.com/store/apps/details?id=com.kingspankwe.watchmanconnect&hl=en_GB).

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
   This installs the [xml2js](https://www.npmjs.com/package/xml2js) library used for parsing SOAP XML responses.

3. **Configure the Module**

   Open your MagicMirror configuration file (`config/config.js`) in your favorite text editor and add the following entry to the `modules` array:

   ```js
   {
     module: "MMM-WatchManSensit",
     position: "top_right", // Change this to your preferred location.
     config: {
       updateInterval: 3600000, // Update every 1 hour.
       // Configure each tank below.
       // IMPORTANT: The first tank's serial number MUST be the one from the first tank set up in the app.
       // That serial is used to build the user ID ("BOX" + Tank1.serialNumber) for all SOAP requests.
       tanks: [
         {
           serialNumber: "12345678",   // Tank 1 serial (used for both user ID and signalman for Tank 1)
           tankName: "Main Tank",
           displayFillLevel: true,
           displayQuantityRemaining: true,
           displayConsumption: true,
           displayLastReading: true,
           displayExpectedEmpty: true
         },
         {
           serialNumber: "87654321",   // Tank 2 serial (user ID from Tank 1 is used for this tank)
           tankName: "Secondary Tank",
           displayFillLevel: true,
           displayQuantityRemaining: true,
           displayConsumption: true,
           displayLastReading: true,
           displayExpectedEmpty: true
         },
         {
           serialNumber: "",           // Blank serial; this tank will be omitted.
           tankName: "Tertiary Tank",
           displayFillLevel: true,
           displayQuantityRemaining: true,
           displayConsumption: true,
           displayLastReading: true,
           displayExpectedEmpty: true
         }
       ],
       password: "Password1!", // Shared password for all tanks.
       culture: "en"           // Culture/language parameter.
     }
   }
   ```

4. **Restart MagicMirror**

   Restart your MagicMirror instance so that the new module loads. For example, if you are using PM2:
   ```bash
   pm2 restart MagicMirror
   ```
   Or restart your MagicMirror service using your usual method.

## How It Works

1. **SOAP Request Construction:**  
   For each tank, the module constructs a SOAP request:
   - For **Tank 1**, the `<userid>` is built from its own serial (i.e., `"BOX" + Tank1.serialNumber`) and `<signalmanno>` is its serial.
   - For **Tanks 2 and 3**, the `<userid>` is the same as Tank 1's (i.e., `"BOX" + Tank1.serialNumber`), while `<signalmanno>` is each tank's own serial number.
   
2. **Data Retrieval & Parsing:**  
   The module sends SOAP requests to:
   ```
   https://www.connectsensor.com/soap/MobileApp.asmx
   ```
   with the SOAPAction `"http://mobileapp/SoapMobileAPPGetLatestLevel_v3"`. The SOAP response is parsed to extract:
   - **LevelPercentage:** The fill level.
   - **LevelLitres:** The quantity remaining (displayed as "Quantity remaining:").
   - **ConsumptionRate:** The average use per day (displayed as "Average use per day:" with a " L" suffix).
   - **ReadingDate:** The last reading timestamp (formatted without seconds and with a 2-digit year).
   - **RunOutDate:** The expected empty date (formatted as date-only with a 2-digit year).
   
3. **Display:**  
   The front-end module displays a block for each tank with valid data in the following order:
   - **Tank Name**
   - **Fill level:** e.g., "Fill level: 85%"
   - **Quantity remaining:** e.g., "Quantity remaining: 2087 L"
   - **Average use per day:** e.g., "Average use per day: 20.50 L"
   - **Last reading:** e.g., "Last reading: 09/02/25, 02:44" (displayed in red if over 48 hours old)
   - **Expected empty:** e.g., "Expected empty: 25/04/25" (displayed in red if within 4 weeks)
   
   Each data line can be individually hidden via configuration flags. Tanks with invalid data or a blank serial number are omitted or display an error message.

## Repository

The source code for this module is hosted on GitHub:  
[https://github.com/darrenmfw/MMM-WatchManSensit](https://github.com/darrenmfw/MMM-WatchManSensit)

## License

This project is licensed under the MIT License.
