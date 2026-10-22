// Run with: node --test preflight/engine.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('./data/rules.js');
const requirements = require('./data/requirements.js');
const { validate, evaluate } = require('./engine.js');

const run = (ids) => evaluate(ids, requirements, rules);

test('catalog is valid and capped at 10 entries', () => {
  assert.deepEqual(validate(requirements, rules), []);
  assert.ok(requirements.length <= 10);
});

test('catalog uses every status at least once', () => {
  for (const status of rules.statusOrder) {
    assert.ok(requirements.some((r) => r.status === status), `no entry with status ${status}`);
  }
});

test('validate rejects bad entries', () => {
  const bad = [
    { id: 'a', title: 't', short: 's', status: 'insufficient', fact: 'f', implication: 'i',
      sources: [{ label: 'x', url: 'https://x' }], checkedOn: '2026-10-22' },
    { id: 'a', title: 't', short: 's', status: 'bogus' },
    { id: 'b', title: 't', short: 's', status: 'not_evaluated', scopeNote: 'n', fact: 'should not be here' },
  ];
  const errors = validate(bad, rules);
  assert.ok(errors.some((e) => e.includes('needs both')));
  assert.ok(errors.some((e) => e.includes('duplicate')));
  assert.ok(errors.some((e) => e.includes('unknown status')));
  assert.ok(errors.some((e) => e.includes('must not carry')));
});

test('no selection gives the prompt, not a verdict', () => {
  const r = run([]);
  assert.equal(r.overall.level, 'none');
  assert.equal(r.selectedCount, 0);
});

test('precedence: unsupported beats insufficient, caveat and supported', () => {
  const r = run(['evm-fork-features', 'eip-7702', 'fee-market', 'priority-fee']);
  assert.equal(r.overall.level, 'blocker');
  assert.deepEqual(r.overall.ids, ['priority-fee']);
});

test('precedence: insufficient beats caveat and supported', () => {
  const r = run(['evm-fork-features', 'eip-7702', 'erc-4337']);
  assert.equal(r.overall.level, 'unknown');
  assert.deepEqual(r.overall.ids, ['erc-4337']);
  assert.equal(r.settleList.length, 1);
  assert.ok(r.settleList[0].settle.length > 0);
});

test('precedence: caveat beats supported', () => {
  const r = run(['evm-fork-features', 'eip-7702']);
  assert.equal(r.overall.level, 'caveat');
});

test('all supported gives the all-clear wording, scoped to evaluated items', () => {
  const r = run(['evm-fork-features']);
  assert.equal(r.overall.level, 'clear');
  assert.match(r.overall.detail, /documentation only/);
});

test('not evaluated is excluded from the result and never counted as unsupported', () => {
  const r = run(['evm-fork-features', 'michelson-nac-bridging']);
  assert.equal(r.overall.level, 'clear');
  assert.equal(r.counts.unsupported, 0);
  assert.equal(r.counts.not_evaluated, 1);
  assert.equal(r.evaluatedCount, 1);
  assert.equal(r.selectedCount, 2);
  assert.match(r.notEvaluatedNotice, /does not mean unsupported/);
});

test('only not-evaluated items selected gives no result', () => {
  const r = run(['michelson-nac-bridging']);
  assert.equal(r.overall.headline, 'No result');
  assert.equal(r.evaluatedCount, 0);
});

test('counts add up and items are ordered by status then catalog order', () => {
  const r = run(requirements.map((q) => q.id));
  const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
  assert.equal(total, requirements.length);
  const ranks = r.items.map((q) => rules.statusOrder.indexOf(q.status));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test('deterministic: same input gives same output regardless of selection order or duplicates', () => {
  const a = run(['eip-7702', 'priority-fee', 'erc-4337']);
  const b = run(['erc-4337', 'priority-fee', 'priority-fee', 'eip-7702']);
  assert.deepEqual(a, b);
});

test('unknown id throws', () => {
  assert.throws(() => run(['nope']), /Unknown requirement id/);
});
