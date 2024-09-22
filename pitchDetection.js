import record from 'node-record-lpcm16';
import Pitchfinder from 'pitchfinder';

// Create the pitch detector
const detectPitch = Pitchfinder.YIN({
  threshold: 0.1,
});

const minPitch = 30;  // Lowered pitch threshold to capture lower notes (B0)
const maxPitch = 400; // Highest expected pitch (24th fret on G string)

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

// Exported function to start pitch detection
export function startPitchDetection(onPitchDetected) {
  const recording = record.record({
    sampleRate: 44100,
    channels: 1,
    device: 'AudioBox USB',
    audioType: 'raw',
    buffer: 2048,
  });

  recording.stream().on('data', (chunk) => {
    const floatArray = new Float32Array(chunk.length / 2);
    for (let i = 0; i < chunk.length; i += 2) {
      floatArray[i / 2] = chunk.readInt16LE(i) / 32768;
    }

    const pitch = detectPitch(floatArray);

    if (pitch) {
      if (pitch && pitch >= minPitch && pitch <= maxPitch) {
        const detectedTone = getNoteFromPitch(pitch);
        console.log(`Detected pitch: ${pitch.toFixed(2)} Hz (Note: ${detectedTone})`);
        onPitchDetected(detectedTone);
      }
    }
  });
}
