import { playSample, playMetronomeClick, audioCtx } from "./audio.js";

export const STEPS_PER_LANE = 16;

export function parseRhythmRow(str, stepsPerLane = STEPS_PER_LANE) {
  return Array.from(str)
    .map((char) => char === "x")
    .slice(0, stepsPerLane);
}

export function patternToText(pattern) {
  return pattern
    .map((row) => row.map((cell) => (cell ? "x" : "-")).join(""))
    .join("\n");
}

export function parsePatternTextToArray(text) {
  const lines = text.trim().split("\n");
  return lines.map((line) => parseRhythmRow(line));
}

export async function playPatternArray(patternArray, options = {}) {
  const { includeMetronome = false } = options;

  const stepDuration = 0.11;
  const now = audioCtx.currentTime;

  if (includeMetronome) {
    // Play 16 metronome clicks first (4 bars)
    for (let step = 0; step < 16; step++) {
      if (step % 4 === 0) {
        const metronomeTime = now + step * stepDuration;
        playMetronomeClick(metronomeTime);
      }
    }
  }

  // Start pattern after metronome clicks
  const startTime = includeMetronome ? now + 16 * stepDuration : now;

  for (let step = 0; step < STEPS_PER_LANE; step++) {
    const hitTime = startTime + step * stepDuration;

    for (let lane = 0; lane < patternArray.length; lane++) {
      if (patternArray[lane][step]) {
        playSample(hitTime, lane);
      }
    }
  }
}
