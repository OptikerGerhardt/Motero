'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ATTENTION, DELEGATED, isInternalWork, stalledWork, monitor } = require('./agent-queue.cjs');

const now = Date.parse('2026-11-24T18:00:00Z');
const old = '2026-11-24T14:00:00Z';
const recent = '2026-11-24T17:30:00Z';
const owner = 'OptikerGerhardt';
const repository = owner + '/Motero';
const review = 'agent:needs-review';

function pull(labels = [review, DELEGATED], head = 'a'.repeat(40), repo = repository, base = 'develop') {
  return {
    number: 20, state: 'open', created_at: old,
    head: { sha: head, repo: { full_name: repo } }, base: { ref: base },
    labels: labels.map(name => ({ name })),
  };
}

function label(name, actor = owner, created_at = recent) {
  return { event: 'labeled', label: { name }, actor: { login: actor }, created_at };
}

const delegated = label(DELEGATED, owner, old);

function check(pull, events = [], headDate = old, checks = []) {
  return stalledWork(pull, [delegated, ...events], headDate, checks, now, owner);
}

test('isolates internal integration PRs from forks and main', () => {
  assert.equal(isInternalWork(pull(), repository), true);
  assert.equal(isInternalWork(pull([], '', repository, 'feature/bookmarks'), repository), true);
  assert.equal(isInternalWork(pull([], '', 'someone/Motero'), repository), false);
  assert.equal(isInternalWork(pull([], '', repository, 'main'), repository), false);
});

test('review chatter, the watchdog label and untrusted changes do not renew the deadline', () => {
  const reason = check(pull(), [
    { event: 'commented', created_at: recent },
    label(ATTENTION),
    label(review, 'outsider'),
  ]);
  assert.match(reason, /^Agent 3/);
});

test('new commits, real handoffs and running CI pause the deadline', () => {
  assert.equal(check(pull(), [], recent, []), null);
  assert.equal(check(pull(), [label(review, 'OptikerLeergespart')]), null);
  assert.equal(check(pull(), [], old, [
    { name: 'build', status: 'in_progress', started_at: recent },
  ]), null);
  assert.match(check(pull(), [], old, [
    { name: 'build', status: 'in_progress', started_at: old },
  ]), /^Agent 3/);
});

test('external waits and historical unlabeled work do not starve the queue', () => {
  for (const labels of [[], ['agent:blocked'], ['agent:ready-for-human-review']]) {
    assert.equal(check(pull(labels.concat(DELEGATED))), null);
  }
  assert.match(check(pull([review, 'agent:needs-fix', DELEGATED])), /^Agent 1/);
  assert.match(check(pull(['agent:review-passed', DELEGATED])), /^Agent 4/);
});

test('only a current delegation label applied by the owner can activate an implementation', () => {
  assert.equal(check(pull([review])), null);
  assert.equal(stalledWork(pull(), [], old, [], now, owner), null);
  assert.equal(check(pull(), [label(DELEGATED, 'OptikerLeergespart')]), null);
  assert.equal(check(pull(), [{ ...delegated, event: 'unlabeled' }]), null);
  assert.equal(check(pull(), [label(DELEGATED)]), null);
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
    paginate: async endpoint => endpoint === pulls.list ? [initial] : [delegated],
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

  const alreadyMarked = apiFixture(pull([review, ATTENTION, DELEGATED]));
  await alreadyMarked.run(false);
  assert.deepEqual(alreadyMarked.actions, [['report', 2], ['fail']]);
});

test('clears attention on a genuine block and ignores a racing HEAD update', async () => {
  const blocked = apiFixture(pull(['agent:blocked', ATTENTION, DELEGATED]));
  await blocked.run(false);
  assert.deepEqual(blocked.actions, [['remove', ATTENTION]]);

  const raced = apiFixture(pull(), pull([review, DELEGATED], 'b'.repeat(40)));
  await raced.run(false);
  assert.deepEqual(raced.actions, []);
});

test('dry run reports work without writing labels or failing', async () => {
  const app = apiFixture(pull());
  await app.run(true);
  assert.deepEqual(app.actions, [['report', 2]]);
});
