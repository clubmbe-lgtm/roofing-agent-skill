// The takeoff script, run the way an agent runs it: one JSON argument in, one JSON object out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../roofing/scripts/takeoff.mjs', import.meta.url));

function takeoff(input) {
  const run = spawnSync(process.execPath, [SCRIPT, JSON.stringify(input)], { encoding: 'utf8' });
  return { code: run.status, out: run.stdout, err: run.stderr.trim() };
}

function quantities(input) {
  const { code, out, err } = takeoff(input);
  assert.equal(code, 0, err);
  return Object.fromEntries(JSON.parse(out).items.map((i) => [i.description, `${i.quantity} ${i.unit}`]));
}

test('a signed job: shingles and underlayment with 10 % waste, a kit per skylight, ridge vent by 4 ft', () => {
  assert.deepEqual(quantities({ squares: 8, skylights: 2, ridgeFeet: 10 }), {
    'Architectural shingles': '27 bundles',
    'Synthetic underlayment, 10-square roll': '1 roll',
    'Skylight flashing kit': '2 kits',
    'Ridge vent, 4 ft section': '3 pieces',
  });
});

test('8 squares stay at 27 bundles: 26.4 is not rounded past 27 by floating point', () => {
  assert.equal(quantities({ squares: 8 })['Architectural shingles'], '27 bundles');
});

test('a cut-up roof takes the waste it is given', () => {
  assert.deepEqual(quantities({ squares: 24, wastePercent: 15 }), {
    'Architectural shingles': '83 bundles',
    'Synthetic underlayment, 10-square roll': '3 rolls',
  });
});

test('no skylight and no ridge: no line for them', () => {
  assert.deepEqual(Object.keys(quantities({ squares: 10 })), [
    'Architectural shingles',
    'Synthetic underlayment, 10-square roll',
  ]);
});

test('the summary reads like the order', () => {
  const { out } = takeoff({ squares: 8, skylights: 2, ridgeFeet: 10 });
  assert.equal(JSON.parse(out).summary, '8 sq → 27 bundles · 1 roll · 2 kits · 3 pieces');
});

test('numbers written as text are read as numbers', () => {
  assert.equal(quantities({ squares: '8', ridgeFeet: '10' })['Ridge vent, 4 ft section'], '3 pieces');
});

test('a waste of null means the default 10 %, not 0 %', () => {
  assert.equal(quantities({ squares: 8, wastePercent: null })['Architectural shingles'], '27 bundles');
});

test('bad values are refused with a reason, never guessed', () => {
  assert.deepEqual(takeoff({}), { code: 1, out: '', err: 'squares is required' });
  assert.equal(takeoff({ squares: 0 }).err, 'squares must be more than 0');
  assert.equal(takeoff({ squares: 'eight' }).err, 'squares must be a number, 0 or more');
  assert.equal(takeoff({ squares: 8, skylights: -1 }).err, 'skylights must be a number, 0 or more');
  assert.equal(takeoff({ squares: 8, wastePercent: 60 }).err, 'wastePercent must be 50 or less');
  for (const squares of [true, [8], '', ' ']) {
    assert.equal(takeoff({ squares }).err, 'squares must be a number, 0 or more', JSON.stringify(squares));
  }
});

test('a misspelled field is refused, so no line goes missing from the order', () => {
  const { code, err } = takeoff({ squares: 8, ridgeFeets: 10 });
  assert.equal(code, 1);
  assert.equal(err, 'unknown field "ridgeFeets": the fields are squares, skylights, ridgeFeet, wastePercent');
});

test('input that is not a JSON object is refused', () => {
  const raw = (arg) => {
    const run = spawnSync(process.execPath, [SCRIPT, arg], { encoding: 'utf8' });
    return { code: run.status, err: run.stderr.trim() };
  };
  const example = 'for example {"squares":8,"skylights":2,"ridgeFeet":10}';
  assert.deepEqual(raw('{squares: 8}'), { code: 1, err: `the input must be JSON, ${example}` });
  for (const arg of ['null', '8', '[8]', '"8"']) {
    assert.deepEqual(raw(arg), { code: 1, err: `the input must be a JSON object, ${example}` }, arg);
  }
});
