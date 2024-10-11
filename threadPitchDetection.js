import { fork } from 'child_process';

// Define frequency ranges and settings for each process

const ranges = [
  { min: 0, max: 100, sampleRate: 22050, buffer: 8192 },   // Low frequencies
  { min: 0, max: 400, sampleRate: 44100, buffer: 6144 },   // Mid frequencies (overlap with low and high)
  { min: 350, max: 1200, sampleRate: 48000, buffer: 4096 }  // High frequencies
];

// Function to start pitch detection for each frequency range
export function startPitchDetection(onPitchDetected) {
  ranges.forEach((range, index) => {
    const pitchWorker = fork('./pitchWorker.js'); // Fork a child process for each range

    // Send range, sampleRate, and buffer size to the child process
    pitchWorker.send({
      minPitch: range.min,
      maxPitch: range.max,
      sampleRate: range.sampleRate,
      buffer: range.buffer,
    });

    // Listen for detected pitches from the child process
    pitchWorker.on('message', (message) => {
      if (message.pitch) {
        console.log(`Range ${index + 1}: Detected pitch: ${message.pitch} Hz (Note: ${message.note})`);
        onPitchDetected(message.note);
      }
    });

    pitchWorker.on('exit', (code) => {
      console.log(`Pitch detection process for range ${index + 1} exited with code ${code}`);
    });
  });
}

