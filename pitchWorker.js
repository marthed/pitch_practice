import record from 'node-record-lpcm16';
import Pitchfinder from 'pitchfinder';

// Create the pitch detector
const detectPitch = Pitchfinder.YIN({
  threshold: 0.05, // Adjust sensitivity threshold for detection
});

// Utility to convert pitch to tone name (e.g., A1, C#2)
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteFromPitch(frequency) {
  const A4 = 440;
  const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
  const noteNumber = semitonesFromA4 + 69;
  const noteIndex = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}

// Listen for messages from the parent process
process.on('message', ({ minPitch, maxPitch, sampleRate, buffer }) => {
  console.log(`Starting pitch detection for range: ${minPitch} Hz - ${maxPitch} Hz with sampleRate: ${sampleRate} and buffer: ${buffer}`);

  const recording = record.record({
    sampleRate: sampleRate,
    channels: 1,
    device: 'AudioBox USB',  // Adjust for your device if necessary
    audioType: 'raw',
    buffer: buffer,
  });

  recording.stream().on('data', (chunk) => {
    const floatArray = new Float32Array(chunk.length / 2);
    for (let i = 0; i < chunk.length; i += 2) {
      floatArray[i / 2] = chunk.readInt16LE(i) / 32768;
    }

    const pitch = detectPitch(floatArray);

    if (pitch && pitch >= minPitch && pitch <= maxPitch) {
      const frequency = maxPitch === 100 ? pitch / 2 : pitch;
      const detectedTone = getNoteFromPitch(frequency);
      process.send({ pitch: frequency.toFixed(2), note: detectedTone });
    }
  });
});
