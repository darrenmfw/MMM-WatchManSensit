from flask import Flask, jsonify
from kingspan_connect_sensor.src.connectsensor.client import AsyncSensorClient  # Fixed import path
import datetime
import asyncio

USERNAME = "your_email@example.com"
PASSWORD = "your_password"

app = Flask(__name__)

async def get_tank_data():
    print("DEBUG: Initializing AsyncSensorClient...")  # Debugging log
    client = AsyncSensorClient()  # Create Kingspan API Client
    await client.login(USERNAME, PASSWORD)  # Authenticate
    print("DEBUG: AsyncSensorClient initialized!")

    tanks = await client.tanks  # Fetch tank data
    print(f"DEBUG: Retrieved {len(tanks)} tanks")  # Debugging log

    tank_data = {}
    for i, tank in enumerate(tanks):
        level = tank.percentage
        history = await tank._get_history(tank.signalman_no, days=14)  # Correct history method

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
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        data = loop.run_until_complete(get_tank_data())
        return jsonify(data)
    except Exception as e:
        print(f"ERROR: {str(e)}")  # Log error for debugging
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("DEBUG: Starting Flask API on port 5001")  # Debug log
    app.run(host='0.0.0.0', port=5001)

