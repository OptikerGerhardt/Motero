'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ATTENTION, isInternalWork, stalledWork, monitor } = require('./agent-queue.cjs');

const now = Date.parse('2026-11-24T18:00:00Z');
const old = '2026-11-24T14:00:00Z';
const recent = '2026-11-24T17:30:00Z';
const owner = 'OptikerGerhardt';
const repository = owner + '/Motero';
const reviewer = new Set([owner, 'OptikerLeergespart', 'github-actions[bot]']);
const review = 'agent:needs-review';

function pull(labels = [review], head = 'a'.repeat(40), repo = repository, base = 'develop') {
  return {
    number: 20, state: 'open', created_at: old,
    head: { sha: head, repo: { full_name: repo } }, base: { ref: base },
    labels: labels.map(name => ({ name })),
  };
}

function label(name, actor = owner) {
  return { event: 'labeled', label: { name }, actor: { login: actor }, created_at: recent };
}

test('isolates internal integration PRs from forks and main', () => {
  assert.equal(isInternalWork(pull(), repository), true);
  assert.equal(isInternalWork(pull([], '', repository, 'feature/bookmarks'), repository), true);
  assert.equal(isInternalWork(pull([], '', 'someone/Motero'), repository), false);
  assert.equal(isInternalWork(pull([], '', repository, 'main'), repository), false);
});

test('review chatter, the watchdog label and untrusted changes do not renew the deadline', () => {
  const reason = stalledWork(pull(), [
    { event: 'commented', created_at: recent },
    label(ATTENTION),
    label(review, 'outsider'),
  ], old, [], now, reviewer);
  assert.match(reason, /^Agent 3/);
});

test('new commits, real handoffs and running CI pause the deadline', () => {
  assert.equal(stalledWork(pull(), [], recent, [], now, reviewer), null);
  assert.equal(stalledWork(pull(), [label(review, 'OptikerLeergespart')], old, [], now, reviewer), null);
  assert.equal(stalledWork(pull(), [], old, [
    { name: 'build', status: 'in_progress', started_at: recent },
  ], now, reviewer), null);
  assert.match(stalledWork(pull(), [], old, [
    { name: 'build', status: 'in_progress', started_at: old },
  ], now, reviewer), /^Agent 3/);
});

test('external waits and historical unlabeled work do not starve the queue', () => {
  for (const labels of [[], ['agent:blocked'], ['agent:ready-for-human-review']]) {
    assert.equal(stalledWork(pull(labels), [], old, [], now, reviewer), null);
  }
  assert.match(stalledWork(pull([review, 'agent:needs-fix']), [], old, [], now, reviewer), /^Agent 1/);
  assert.match(stalledWork(pull(['agent:review-passed']), [], old, [], now, reviewer), /^Agent 4/);
});

function apiFixture(initial, current = initial) {
  const actions = [];
  const pulls = {
    list() {},
    get: async () => ({ data: current }),
  };
  const issues = {
    listEvents() {},
    addLabels: async ({ labels }) => actions.push(['add', labels]),
    removeLabel: async ({ name }) => actions.push(['remove', name]),
  };
  const github = {
    rest: {
      pulls, issues,
      repos: { getCommit: async () => ({ data: { commit: { committer: { date: old } } } }) },
      checks: { listForRef: async () => ({ data: { check_runs: [] } }) },
    },
    paginate: async endpoint => endpoint === pulls.list ? [initial] : [],
  };
  const core = {
    summary: { addHeading() {}, addRaw() {}, addTable(rows) { actions.push(['report', rows.length]); }, async write() {} },
    setFailed: () => actions.push(['fail']),
  };
  const context = { repo: { owner, repo: 'Motero' }, serverUrl: 'https://github.com' };
  return { actions, run: dryRun => monitor({ github, core, context, dryRun, now }) };
}

test('publishes one attention label for stale work and keeps its phase', async () => {
  const app = apiFixture(pull());
  await app.run(false);
  assert.deepEqual(app.actions, [['add', [ATTENTION]], ['report', 2], ['fail']]);

  const alreadyMarked = apiFixture(pull([review, ATTENTION]));
  await alreadyMarked.run(false);
  assert.deepEqual(alreadyMarked.actions, [['report', 2], ['fail']]);
});

test('clears attention on a genuine block and ignores a racing HEAD update', async () => {
  const blocked = apiFixture(pull(['agent:blocked', ATTENTION]));
  await blocked.run(false);
  assert.deepEqual(blocked.actions, [['remove', ATTENTION]]);

  const raced = apiFixture(pull(), pull([review], 'b'.repeat(40)));
  await raced.run(false);
  assert.deepEqual(raced.actions, []);
});

test('dry run reports work without writing labels or failing', async () => {
  const app = apiFixture(pull());
  await app.run(true);
  assert.deepEqual(app.actions, [['report', 2]]);
});
