export const audioCtx = new (window.AudioContext ||
  window.webkitAudioContext)();
const instrumentFiles = [
  "sounds/crash.wav",
  "sounds/hhat.wav",
  "sounds/ride.wav",
  "sounds/htom.wav",
  "sounds/mtom.wav",
  "sounds/snare.wav",
  "sounds/ftom.wav",
  "sounds/kick.wav",
];
const buffers = new Array(instrumentFiles.length).fill(null);
let metronomeBuffer = null;

const volumeLevels = [0.3, 0.6, 1.0];

const savedVolumeIndex = localStorage.getItem("volume");
let currentVolumeIndex =
  savedVolumeIndex !== null ? Number(savedVolumeIndex) : 2;

const gainNode = audioCtx.createGain();
gainNode.gain.value = volumeLevels[currentVolumeIndex];
gainNode.connect(audioCtx.destination);

window.audioAPI = window.audioAPI || {};

window.audioAPI.currentVolumeIndex = currentVolumeIndex;

window.audioAPI.cycleVolumeLevel = function () {
  currentVolumeIndex = (currentVolumeIndex + 1) % volumeLevels.length;
  window.audioAPI.currentVolumeIndex = currentVolumeIndex;
  gainNode.gain.value = volumeLevels[currentVolumeIndex];
  localStorage.setItem("volume", currentVolumeIndex);
  return currentVolumeIndex;
};

export async function loadSamples() {
  for (let i = 0; i < instrumentFiles.length; i++) {
    const res = await fetch(instrumentFiles[i]);
    const buf = await res.arrayBuffer();
    buffers[i] = await audioCtx.decodeAudioData(buf);
  }

  const metronomeRes = await fetch("sounds/metronome.wav");
  const metronomeArr = await metronomeRes.arrayBuffer();
  metronomeBuffer = await audioCtx.decodeAudioData(metronomeArr);
}

export function playSample(time, lane) {
  if (!buffers[lane]) return;
  const src = audioCtx.createBufferSource();
  src.buffer = buffers[lane];

  const gain = audioCtx.createGain();
  gain.gain.value = volumeLevels[currentVolumeIndex];

  src.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(time);
}

export function playMetronomeClick(time) {
  if (!metronomeBuffer) return;
  const src = audioCtx.createBufferSource();
  src.buffer = metronomeBuffer;

  const gain = audioCtx.createGain();
  gain.gain.value = volumeLevels[currentVolumeIndex];

  src.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(time);
}