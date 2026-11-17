import { readFileSync } from 'node:fs'

function median(values) {
  const ordered = values.slice().sort((a, b) => a - b);
  const half = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[half] : (ordered[half - 1] + ordered[half]) / 2;
}
function analyze(data) {
  const {values, window, cutoff, minDelta} = data;
  if (!Array.isArray(values) || values.length > 10000 || values.some(n => !Number.isFinite(n) || Math.abs(n) > 1e100) ||
      !Number.isInteger(window) || window < 2 || window > Math.min(1000, values.length - 1) ||
      !Number.isFinite(cutoff) || cutoff <= 0 || !Number.isFinite(minDelta) || minDelta < 0)
    throw new Error('Use finite values, a valid window from 2 to 1,000, a positive cutoff and a nonnegative noise floor');
  const flagged = [], diagnostics = [];
  for (let index = window; index < values.length; index++) {
    const earlier = values.slice(index - window, index);
    const center = median(earlier);
    const mad = median(earlier.map(n => Math.abs(n - center)));
    const delta = Math.abs(values[index] - center);
    const score = mad ? delta / (1.4826 * mad) : null;
    if (delta > minDelta && (score === null || score >= cutoff)) flagged.push(index);
    diagnostics.push({index, value: values[index], median: center, mad, score: Number.isFinite(score) ? score : null});
  }
  return {flagged, samplesEvaluated: diagnostics.length, diagnostics};
}

try {
  if (process.argv.length !== 3) throw new Error('Usage: node app.mjs input.json')
  console.log(JSON.stringify(analyze(JSON.parse(readFileSync(process.argv[2], 'utf8')))))
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
