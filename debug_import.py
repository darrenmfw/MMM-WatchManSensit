import sys
print("Python Executable:", sys.executable)
print("Python Version:", sys.version)
print("Python Path:", sys.path)

try:
    import kingspan_connect_sensor
    print("✅ Successfully imported kingspan_connect_sensor")
except ModuleNotFoundError:
    print("❌ ModuleNotFoundError: kingspan_connect_sensor not found")
