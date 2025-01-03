import time
from flask import Flask, render_template, request, jsonify
import serial
import threading

app = Flask(__name__)

# Serial configuration to communicate with Arduino
#SERIAL_PORT = '/dev/ttyUSB0'  # Ubuntu
SERIAL_PORT = 'COM1'  # Windows - Replace with the actual port for your Arduino
BAUD_RATE = 9600
fan_speeds = {}

try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
except serial.SerialException as e:
    print(f"Error: {e}")
    print("Ensure the correct COM port is configured and the Arduino is connected.")

# To prevent conflicts in serial communication, use a lock
serial_lock = threading.Lock()
stop_experiment = threading.Event()  # Event to stop the experiment


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
            print(command)
            #arduino.write(command.encode())

    return jsonify({"status": "success"}), 200

@app.route('/stop-all', methods=['POST'])
def stop_all():
    # Send stop command to all fans
    with serial_lock:
        for fan in range(1, 37):  # Assuming a total of 36 fans
            command = f"{fan},0\n"
            print(command)
            #arduino.write(command.encode())

    return jsonify({"status": "success"}), 200

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    data = request.json
    header = data['header']
    rows = data['data']

    stop_experiment.clear()  # Reset the stop flag
    threading.Thread(target=run_experiment, args=(header, rows)).start()
    return jsonify({"status": "success"}), 200

def run_experiment(header, rows):
    global experiment_running
    experiment_running = True
    fan_ids = header[1:]  # Skip the 'time' column
    for row in rows:
        if stop_experiment.is_set():
            break  # Stop experiment if flag is set

        time_interval = float(row[0])  # First column is time
        velocities = row[1:]  # Remaining columns are velocities

        with serial_lock:
            for fan_id, velocity in zip(fan_ids, velocities):
                fan_speeds[fan_id] = velocity
                command = f"{fan_id},{velocity}\n"
                print(command)
                #arduino.write(command.encode())

        time.sleep(time_interval)  # Wait for the next time interval
    experiment_running = False  # Mark experiment as finished

@app.route('/fan-status', methods=['GET'])
def fan_status():
    return jsonify(fan_speeds)

@app.route('/experiment-status', methods=['GET'])
def experiment_status():
    return jsonify({"running": experiment_running})

@app.route('/stop-experiment', methods=['POST'])
def stop_experiment_route():
    stop_experiment.set()  # Set the stop flag
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(debug=True)