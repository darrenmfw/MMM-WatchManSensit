# MMM-WatchManSensit

A MagicMirror² module to display oil tank levels monitored by Kingspan Watchman Sensit devices. Uses the `kingspan-connect-sensor` Python library to fetch tank data and estimate depletion dates.

## Features
- Displays oil tank levels as vertical bars with gradient colours.
- Estimates the date when the tank will reach a defined low level threshold.
- Fetches data from Kingspan Watchman Sensit via a Python API.
- Configurable update intervals and history duration.

## Installation

### Step 1: Clone the Repository
Navigate to your MagicMirror `modules` directory and clone the module:
```sh
cd ~/MagicMirror/modules
git clone https://github.com/darrenmfw/MMM-WatchManSensit.git
cd MMM-WatchManSensit
```

### Step 2: Set Up a Virtual Environment and Install Dependencies
Run the following command to create and activate a virtual environment, then install dependencies:
```sh
cd ~/MagicMirror/modules/MMM-WatchManSensit && python3 -m venv venv && source venv/bin/activate && pip install kingspan-connect-sensor flask
```

### Step 3: Configure the Module
Edit your MagicMirror `config.js` file and add the following:
```js
{
  module: "MMM-WatchManSensit",
  position: "top_right",
  config: {
    apiUrl: "http://localhost:5001/get-oil-levels",
    username: "your_email@example.com",
    password: "your_password",
    lowLevelThreshold: 20,
    historyDays: 14,
    updateInterval: 60000
  }
}
```

### Step 4: Set Up the API Server
The `watchman_api.py` script is included in the repository. You just need to run it to start the API server.

### Step 5: Run the API Server
To start the API server manually:
```sh
cd ~/MagicMirror/modules/MMM-WatchManSensit && source venv/bin/activate && python watchman_api.py
```
To ensure the script runs on startup, add it to `crontab`:
```sh
crontab -e
```
Add the following line:
```
@reboot cd ~/MagicMirror/modules/MMM-WatchManSensit && source venv/bin/activate && python watchman_api.py &
```

### Step 6: Restart MagicMirror
Restart MagicMirror to apply changes:
```sh
pm start
```

## License
MIT License

---
Let me know if you need any refinements or additional setup instructions! 🚀

