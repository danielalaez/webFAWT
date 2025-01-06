import time
from flask import Flask, render_template, request, jsonify
import serial
import threading

app = Flask(__name__)

# Serial configuration to communicate with Arduino
#SERIAL_PORT = '/dev/ttyUSB0'  # Ubuntu
SERIAL_PORT = 'COM8'  # Windows - Replace with the actual port for your Arduino
BAUD_RATE = 9600
fan_speeds = {}

try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE)
except serial.SerialException as e:
    print(f"Error: {e}")
    print("Ensure the correct COM port is configured and the Arduino is connected.")


def serial_reader():
    """Continuously read from the serial port and print the data."""
    while True:
        try:
            if arduino.in_waiting > 0:  # Check if there is data to read
                line = arduino.readline().decode('utf-8').strip()
                if line:
                    print(f"Arduino: {line}")
        except serial.SerialException as e:
            print(f"Serial error: {e}")
            break
        except UnicodeDecodeError:
            print("Failed to decode serial data.")

if __name__ == '__main__':
    threading.Thread(target=serial_reader, daemon=True).start()