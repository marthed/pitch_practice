import { startPitchDetection } from './threadPitchDetection.js';
import dgram from 'dgram'; // Importing the dgram module

const SERVER_IP = '127.0.0.1'; // Replace with the server's IP address
const SERVER_PORT = 1234; // Replace with the server's port

const client = dgram.createSocket('udp4');

client.on('close', () => {
  console.log('Socket closed');
});

// Handle any socket errors
client.on('error', (error) => {
  console.error('Socket error:', error);
});

function SendPitchToClient(pitch) {
  client.send(pitch, SERVER_PORT, SERVER_IP, (err) => {
    if (err) {
      console.error('Error sending UDP message:', err);
    } else {
      console.log('Message sent successfully!');
    }
  });
}

// Start the pitch detection system and handle pitch detections
startPitchDetection(SendPitchToClient);
