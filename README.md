# MMM-WatchManSensit

A MagicMirror² module that integrates with the Kingspan WatchMan SENSiT service to display live tank data, including the latest reading and its timestamp.

> **Disclaimer:**  
> This module is based on reverse‑engineering the WatchMan SENSiT communication (as demonstrated in the Home Assistant custom component by community members). The API endpoints, JSON key names, and authentication flow are assumed placeholders and may require adjustment based on your findings. Use at your own risk.

## Features

- **Live Data Retrieval:**  
  Authenticates with the Kingspan Connect service and fetches live sensor data.
- **Display:**  
  Shows the latest tank reading (percentage) and the timestamp of the last reading.
- **Configurable:**  
  Easily update API endpoints, credentials, and update intervals via the MagicMirror configuration.

## Requirements

- [MagicMirror²](https://magicmirror.builders/)
- Node.js (included with the MagicMirror installation)
- Internet connectivity to access the Kingspan Connect API.

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

   This module uses Node's built‑in `https` and `node_helper` modules, so no additional dependencies are required. (If future updates require extra modules, install them with `npm install` inside the module directory.)

3. **Configure the Module**

   Open your MagicMirror `config/config.js` file and add the following entry to the `modules` array:
   ```js
   {
     module: "MMM-WatchManSensit",
     position: "top_right",  // Change this to your preferred position.
     config: {
       updateInterval: 60000,                         // Update every 60 seconds.
       apiBaseUrl: "https://connect.kingspan.com/api",  // Base URL of the Kingspan Connect API.
       username: "YOUR_USERNAME",                     // Your Kingspan Connect username.
       password: "YOUR_PASSWORD"                      // Your Kingspan Connect password.
     }
   }
   ```

4. **Restart MagicMirror**

   Restart your MagicMirror instance to load the new module. For example, if you're using PM2:
   ```bash
   pm2 restart mm
   ```
   or restart the MagicMirror service in whichever way you normally do.

## Configuration Options

- **updateInterval** (number):  
  Time in milliseconds between data updates. Default is 60000 (1 minute).

- **apiBaseUrl** (string):  
  Base URL for the Kingspan Connect API. Default is `"https://connect.kingspan.com/api"`. Adjust as necessary.

- **username** (string):  
  Your Kingspan Connect account username.

- **password** (string):  
  Your Kingspan Connect account password.

## Troubleshooting

- **DNS/Connectivity Issues:**  
  If you receive a "cannot resolve host" error, verify that the API endpoint is correct and reachable. Some secure endpoints do not respond to ping or traceroute requests. Use tools like `curl` or Postman to test HTTPS connectivity.

- **Invalid Credentials:**  
  Ensure your username and password are correct.

- **API Changes:**  
  Since this module is based on reverse‑engineering the WatchMan SENSiT app communication, verify the endpoints and JSON response structure using a tool like Charles Proxy or mitmproxy, and adjust the code accordingly.

## Repository

The source code for this module is hosted on GitHub:  
[https://github.com/darrenmfw/MMM-WatchManSensit](https://github.com/darrenmfw/MMM-WatchManSensit)

## License

This project is licensed under the MIT License.

## Acknowledgements

This module was inspired by community efforts to integrate the Kingspan WatchMan SENSiT device with Home Assistant. Special thanks to the developers behind the [ha-kingspan-watchman-sensit](https://github.com/masaccio/ha-kingspan-watchman-sensit) project.
