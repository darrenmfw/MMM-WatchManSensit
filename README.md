# MMM-WatchManSensit

A MagicMirror² module that integrates with the Kingspan WatchMan SENSiT service to display live tank data, including the latest reading and its timestamp.

> **Disclaimer:**  
> This module is based on reverse‑engineering the WatchMan SENSiT communication (as demonstrated in the Home Assistant custom component). The API endpoints, JSON key names, and authentication flow are assumed placeholders and may require adjustment based on your findings. Use at your own risk.

## Features

- **Live Data Retrieval:**  
  Authenticates with the Kingspan Connect service and fetches live sensor data.
- **Display:**  
  Shows the latest tank reading (percentage) and the timestamp of the last reading.
- **Configurable:**  
  Easily update API endpoints, credentials, and update intervals via the MagicMirror config.

## Requirements

- [MagicMirror²](https://magicmirror.builders/)
- Node.js (comes with MagicMirror installation)
- Internet connectivity to access the Kingspan Connect API.

## Installation

1. **Clone the Repository**

   Open a terminal and navigate to your MagicMirror modules directory:
   ```bash
   cd ~/MagicMirror/modules

