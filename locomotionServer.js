import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
//import { startPitchDetection } from './pitchDetection.js'; // Import pitch detection logic
import { startPitchDetection } from './threadPitchDetection.js';

// Set up Express server
const app = express();
const server = http.createServer(app);

// Serve the front-end files
app.use(express.static('public'));

// Set up WebSocket server
const wss = new WebSocketServer({ server });

let connectedClients = [];
let currentTone = '';
let scales = [];

// Handle WebSocket connections
wss.on('connection', (ws) => {
  connectedClients.push(ws);

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log(data);
    if (data.type === 'selectScale') {
      scales = data.scales;
      console.log(scales);
      sendNewRandomTone();
    }
  });

  ws.on('close', () => {
    connectedClients = connectedClients.filter((client) => client !== ws);
  });
});

// Generate a random tone from selected scales
function sendNewRandomTone() {
  if (scales.length === 0) return;

  const randomScale = scales[Math.floor(Math.random() * scales.length)];
  const randomNote =
    randomScale[Math.floor(Math.random() * randomScale.length)];
  currentTone = randomNote;

  broadcast({
    type: 'newTone',
    tone: currentTone,
  });
}

// Send message to all connected clients
function broadcast(data) {
  connectedClients.forEach((client) => {
    client.send(JSON.stringify(data));
  });
}

// Pitch detection callback
const timeBlock = 1000;

let lastTone = 'X';
let startTime = Date.now();

function IsBlocked(tone) {
  const currentTime = Date.now();
  if (currentTime - startTime < timeBlock) {
    return true;
  }
  if (lastTone === tone && lastTone !== currentTone) {
    return true;
  }
  return false;
}

function handlePitchDetected(detectedTone) {
  const detectedWithoutOctace = detectedTone.slice(0, -1);
  if (IsBlocked(detectedWithoutOctace)) {
    console.log('is blocked');
    return;
  }

  if (detectedWithoutOctace === currentTone) {
    broadcast({
      type: 'correct',
      detectedTone,
    });
    sendNewRandomTone(); // Pick a new random tone
  } else {
    broadcast({
      type: 'wrong',
      detectedTone,
    });
  }
  startTime = Date.now();
  lastTone = detectedWithoutOctace;
}

// Start the pitch detection system and handle pitch detections
startPitchDetection(handlePitchDetected);

// Start the server
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
