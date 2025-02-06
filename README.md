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
Create a new file `watchman_api.py` in the `MMM-WatchManSensit` directory with the following content:
```python
from flask import Flask, jsonify
from kingspan_connect_sensor import KingspanConnect
import datetime

USERNAME = "your_email@example.com"
PASSWORD = "your_password"

app = Flask(__name__)

def get_tank_data():
    client = KingspanConnect(USERNAME, PASSWORD)
    client.authenticate()
    tanks = client.get_tanks()
    
    tank_data = {}
    for i, tank in enumerate(tanks):
        level = tank.percentage
        history = tank.get_level_history(days=14)
        
        if len(history) > 1:
            daily_usage = (history[0] - history[-1]) / len(history)
            days_remaining = (level - 20) / daily_usage if daily_usage > 0 else float('inf')
            estimated_date = (datetime.date.today() + datetime.timedelta(days=days_remaining)).strftime('%Y-%m-%d')
        else:
            estimated_date = "Unknown"

        tank_data[f"tank{i+1}"] = {"level": level, "estimatedDate": estimated_date}

    return tank_data

@app.route('/get-oil-levels', methods=['GET'])
def get_oil_levels():
    try:
        data = get_tank_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

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

