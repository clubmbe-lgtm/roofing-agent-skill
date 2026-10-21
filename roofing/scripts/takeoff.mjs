// takeoff.mjs — the materials to order for a roofing job.
//
// Usage: node takeoff.mjs '{"squares":8,"skylights":2,"ridgeFeet":10}'
//
// Ratios (see ../references/takeoff-ratios.md): 3 bundles of architectural
// shingles per square, underlayment rolls of 10 squares, one flashing kit per
// skylight, ridge vent in 4 ft sections, 10 % waste on shingles and
// underlayment unless "wastePercent" says otherwise. Every quantity is
// rounded up. No prices: the supplier gives them. It reads no file, no
// network, no account: only its input.

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const FIELDS = ['squares', 'skylights', 'ridgeFeet', 'wastePercent'];
const EXAMPLE = '{"squares":8,"skylights":2,"ridgeFeet":10}';

let input;
try {
  input = JSON.parse(process.argv[2] ?? '{}');
} catch {
  fail(`the input must be JSON, for example ${EXAMPLE}`);
}
if (input === null || typeof input !== 'object' || Array.isArray(input)) {
  fail(`the input must be a JSON object, for example ${EXAMPLE}`);
}
// A misspelled field would silently drop its line from the order: refuse it instead.
const unknown = Object.keys(input).find((key) => !FIELDS.includes(key));
if (unknown !== undefined) fail(`unknown field "${unknown}": the fields are ${FIELDS.join(', ')}`);

function given(name) {
  return input[name] !== undefined && input[name] !== null;
}

function count(name, { required = false } = {}) {
  if (!given(name)) {
    if (required) fail(`${name} is required`);
    return 0;
  }
  const value = input[name];
  // Numbers, or numbers written as text; never true, [8] or "", which Number() would turn into 1, 8 or 0.
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 0) fail(`${name} must be a number, 0 or more`);
  return n;
}

const squares = count('squares', { required: true });
if (squares <= 0) fail('squares must be more than 0');
const skylights = Math.ceil(count('skylights'));
const ridgeFeet = count('ridgeFeet');
const wastePercent = given('wastePercent') ? count('wastePercent') : 10;
if (wastePercent > 50) fail('wastePercent must be 50 or less');

const BUNDLES_PER_SQUARE = 3;
const SQUARES_PER_ROLL = 10;
const RIDGE_SECTION_FEET = 4;
const withWaste = squares * (1 + wastePercent / 100);
// A hair below the next whole number stays there (8 x 3 x 1.1 = 26.400000000000002 → 27, not 28).
const up = (n) => Math.ceil(n - 1e-9);

const plural = (n, one, many) => (n === 1 ? one : many);
const items = [];
const bundles = up(withWaste * BUNDLES_PER_SQUARE);
items.push({ description: 'Architectural shingles', quantity: bundles, unit: plural(bundles, 'bundle', 'bundles') });
const rolls = up(withWaste / SQUARES_PER_ROLL);
items.push({ description: 'Synthetic underlayment, 10-square roll', quantity: rolls, unit: plural(rolls, 'roll', 'rolls') });
if (skylights > 0) {
  items.push({ description: 'Skylight flashing kit', quantity: skylights, unit: plural(skylights, 'kit', 'kits') });
}
if (ridgeFeet > 0) {
  const sections = up(ridgeFeet / RIDGE_SECTION_FEET);
  items.push({ description: 'Ridge vent, 4 ft section', quantity: sections, unit: plural(sections, 'piece', 'pieces') });
}

process.stdout.write(
  JSON.stringify({
    basis: { squares, skylights, ridgeFeet, wastePercent },
    items,
    summary: `${squares} sq → ` + items.map((i) => `${i.quantity} ${i.unit}`).join(' · '),
  }),
);
