# MMM-WatchManSensit

A MagicMirror² module to display oil tank levels monitored by Kingspan Watchman Sensit devices. Uses the `kingspan-connect-sensor` Python library to fetch tank data and estimate depletion dates.

## Features
- Displays oil tank levels as vertical bars with gradient colours.
- Estimates the date when the tank will reach a defined low-level threshold.
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

### Step 2: Create a Virtual Environment & Install Dependencies
Ensure you have Python 3 installed, then create a virtual environment and install the required libraries:
```sh
python3 -m venv venv
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt
pip install --no-cache-dir git+https://github.com/masaccio/kingspan-connect-sensor.git
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

### Step 4: Start the API Server
```sh
source venv/bin/activate
nohup python watchman_api.py --host=0.0.0.0 --port=5001 > watchman_api.log 2>&1 &
```

To verify the API is running:
```sh
curl http://127.0.0.1:5001/get-oil-levels
```

### Step 5: Restart MagicMirror
Restart MagicMirror to apply changes:
```sh
pm2 restart MagicMirror
```

To ensure the script runs on startup, add it to `crontab`:
```sh
crontab -e
```
Add the following line:
```
@reboot /usr/bin/python3 /path/to/MMM-WatchManSensit/venv/bin/python /path/to/MMM-WatchManSensit/watchman_api.py --host=0.0.0.0 --port=5001 &
```

### Step 6: Troubleshooting
If the module is stuck on "Loading oil levels", try the following:
```sh
pkill -f watchman_api.py
source venv/bin/activate
nohup python watchman_api.py --host=0.0.0.0 --port=5001 > watchman_api.log 2>&1 &
curl http://127.0.0.1:5001/get-oil-levels
```

## License
MIT License

---
Let me know if you need any refinements or additional setup instructions! 🚀

