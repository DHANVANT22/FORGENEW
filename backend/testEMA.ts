// EMA Test Script
const ALPHA = 0.4;
let previousScore = 10;
let noisyCurrentSpike = 100;

console.log(`Initial previous score: ${previousScore}`);
console.log(`Raw noisy spike computed for today: ${noisyCurrentSpike}`);

let smoothedScore = Math.round((ALPHA * noisyCurrentSpike) + ((1 - ALPHA) * previousScore));
console.log(`Smoothed stored score for today: ${smoothedScore}`);

if (smoothedScore < noisyCurrentSpike) {
  console.log('SUCCESS: Smoothing successfully reduced single-day noise.');
} else {
  console.log('FAILURE: Smoothing did not reduce noise.');
}
