import record from 'node-record-lpcm16';
import Pitchfinder from 'pitchfinder';

// Create the pitch detector
const detectPitch = Pitchfinder.YIN({
  threshold: 0.1, // Adjusting YIN algorithm threshold for better sensitivity
});

// Define note names and frequencies for reference
const noteNames = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

// Convert pitch (frequency in Hz) to the nearest musical note
function getNoteFromPitch(frequency) {
  const A4 = 440; // A4 is the reference pitch
  const semitoneRatio = Math.pow(2, 1 / 12); // Ratio between adjacent semitones

  // Calculate the number of semitones away from A4
  const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));

  // Calculate the note number (starting from C0 as note 0)
  const noteNumber = semitonesFromA4 + 69; // A4 is note number 69

  // Get the note name and octave
  const noteIndex = noteNumber % 12; // Note within the octave (0-11)
  const octave = Math.floor(noteNumber / 12) - 1; // Octave number (C0 is octave -1)

  return `${noteNames[noteIndex]}${octave}`;
}

// Convert audio data to Float32Array
function convertToFloat32Array(buffer) {
  const floatArray = new Float32Array(buffer.length / 2); // Convert 16-bit PCM to 32-bit float
  for (let i = 0; i < buffer.length; i += 2) {
    const int16 = buffer.readInt16LE(i);
    floatArray[i / 2] = int16 / 32768; // Normalize to [-1, 1] range
  }
  return floatArray;
}

// Set pitch and energy thresholds
const minPitch = 30;  // Lowered pitch threshold to capture lower notes (B0)
const maxPitch = 400; // Highest expected pitch (24th fret on G string)
const minEnergyThreshold = 0.0001; // Further lower the minimum energy for sensitivity

// Function to calculate the energy of a signal (sum of squared amplitudes)
function calculateSignalEnergy(floatArray) {
  let energy = 0;
  for (let i = 0; i < floatArray.length; i++) {
    energy += floatArray[i] * floatArray[i];
  }
  return energy / floatArray.length;
}

// Start recording with the AudioBox USB
const recording = record.record({
  sampleRate: 44100,         // Return to higher sample rate for better frequency range
  channels: 1,               // Mono capture
  device: 'AudioBox USB',     // Name of your audio device (check in system settings)
  audioType: 'raw',          // Record raw PCM audio
  threshold: 0,              // Start recording immediately
  buffer: 1024               // Reduced buffer size for quicker note detection
});

// Handle audio data
recording.stream().on('data', (chunk) => {
  const floatArray = convertToFloat32Array(chunk);

  // Calculate signal energy
  const energy = calculateSignalEnergy(floatArray);

  if (energy > minEnergyThreshold) { // Only process if the signal is strong enough
    const pitch = detectPitch(floatArray);

    // Ignore pitches outside of bass range
    if (pitch && pitch >= minPitch && pitch <= maxPitch) {
      const note = getNoteFromPitch(pitch);
      console.log(`Detected pitch: ${pitch.toFixed(2)} Hz (Note: ${note})`);
    }
  }
});

// Start listening for audio
console.log('Listening for bass pitch...');
