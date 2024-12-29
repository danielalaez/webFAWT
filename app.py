from flask import Flask, render_template, request, jsonify
import serial
import threading

app = Flask(__name__)

# Serial configuration to communicate with Arduino
#SERIAL_PORT = '/dev/ttyUSB0'  # Replace with the actual port for your Arduino
SERIAL_PORT = 'COM1'  # Replace with the actual port for your Arduino
BAUD_RATE = 9600

try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
except serial.SerialException as e:
    print(f"Error: {e}")
    print("Ensure the correct COM port is configured and the Arduino is connected.")

# To prevent conflicts in serial communication, use a lock
# To prevent conflicts in serial communication, use a lock
serial_lock = threading.Lock()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/setup')
def setup():
    return render_template('setup.html')

@app.route('/set-dimensions', methods=['POST'])
def set_dimensions():
    data = request.json
    rows = data['rows']
    columns = data['columns']
    return jsonify({"status": "success"}), 200

@app.route('/control-fans', methods=['POST'])
def control_fans():
    data = request.json
    selected_fans = data['selected_fans']
    velocity = data['velocity']

    # Send commands to Arduino
    with serial_lock:
        for fan in selected_fans:
            command = f"{fan},{velocity}\n"
            arduino.write(command.encode())

    return jsonify({"status": "success"}), 200

@app.route('/stop-all', methods=['POST'])
def stop_all():
    # Send stop command to all fans
    with serial_lock:
        for fan in range(1, 37):  # Assuming a total of 36 fans
            command = f"{fan},0\n"
            arduino.write(command.encode())

    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(debug=True)
