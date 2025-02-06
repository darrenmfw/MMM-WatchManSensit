import sys
sys.path.insert(0, "/home/pi/MagicMirror/modules/MMM-WatchManSensit/venv/lib/python3.11/site-packages")

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
