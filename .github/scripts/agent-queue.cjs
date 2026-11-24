'use strict';

const { AGENT_LABELS } = require('./agent-handoff-core.cjs');

const ATTENTION = 'agent:attention';
const DELEGATED = 'agent:implementation-delegated';
const HOURS = 60 * 60 * 1000;
const STALL_AGE = 2 * HOURS;
const REQUIRED_CHECK_NAMES = new Set(['build', 'instrumentation', 'Release baseline parity']);
const OWNERS = new Map([
  ['agent:in-progress', 'Agent 2 implements or names the blocker'],
  ['agent:needs-review', 'Agent 3 completes the exact-HEAD review or assigns the missing check'],
  ['agent:needs-fix', 'Agent 4 fixes the confirmed findings or names the blocker'],
  ['agent:review-passed', 'Agent 4 prepares the owner’s merge decision'],
]);

function isInternalWork(pull, repository) {
  return pull.state === 'open' && pull.head.repo?.full_name === repository
    && (pull.base.ref === 'develop' || pull.base.ref.startsWith('feature/'));
}

function labelsOf(pull) {
  return pull.labels.map(label => label.name);
}

function phasesOf(pull) {
  return labelsOf(pull).filter(label => AGENT_LABELS.includes(label));
}

function ownerDelegated(pull, events, owner) {
  if (!labelsOf(pull).includes(DELEGATED)) return null;
  const lastChange = events.findLast(event => event.label?.name === DELEGATED
    && (event.event === 'labeled' || event.event === 'unlabeled'));
  return lastChange?.event === 'labeled' && lastChange.actor?.login === owner ? lastChange : null;
}

function stalledWork(pull, events, headDate, checks, now, owner) {
  const delegation = ownerDelegated(pull, events, owner);
  if (!delegation) return null;
  const trustedActors = new Set([owner, 'OptikerLeergespart', 'github-actions[bot]']);
  const phases = phasesOf(pull);
  if (phases.length > 1) return 'Agent 1 reconciles the conflicting phase labels';
  const [phase] = phases;
  if (!OWNERS.has(phase)) return null;

  // Comments and attention-label writes must never renew the deadline.
  const phaseDates = events
    .filter(event => event.event === 'labeled' && event.label?.name === phase
      && trustedActors.has(event.actor?.login))
    .map(event => Date.parse(event.created_at));
  const progressDates = [Date.parse(pull.created_at), Date.parse(headDate), Date.parse(delegation.created_at), ...phaseDates]
    .filter(date => Number.isFinite(date) && date <= now);
  if (now - Math.max(...progressDates) < STALL_AGE) return null;
  const activeCI = checks.some(check => REQUIRED_CHECK_NAMES.has(check.name)
    && check.status !== 'completed'
    && now - Date.parse(check.started_at) < STALL_AGE);
  return activeCI ? null : OWNERS.get(phase);
}

async function monitor({ github, context, core, dryRun, now = Date.now() }) {
  const params = context.repo;
  const repository = params.owner + '/' + params.repo;
  const pulls = await github.paginate(github.rest.pulls.list, { ...params, state: 'open' });
  const overdue = [];

  for (const pull of pulls.filter(pull => isInternalWork(pull, repository))) {
    const labels = labelsOf(pull);
    const phases = phasesOf(pull);
    const marked = labels.includes(ATTENTION);
    const selected = labels.includes(DELEGATED);
    const actionable = phases.length > 1 || phases.some(phase => OWNERS.has(phase));
    if (!marked && !(selected && actionable)) continue;

    const issue = { ...params, issue_number: pull.number };
    let reason = null;
    if (selected && actionable) {
      const [events, {data: commit}] = await Promise.all([
        github.paginate(github.rest.issues.listEvents, issue),
        github.rest.repos.getCommit({ ...params, ref: pull.head.sha }),
      ]);
      const headDate = commit.commit.committer.date;
      reason = stalledWork(pull, events, headDate, [], now, params.owner);
      if (reason && phases.length === 1) {
        const {data: result} = await github.rest.checks.listForRef({
          ...params, ref: pull.head.sha, filter: 'latest', per_page: 100,
        });
        reason = stalledWork(pull, events, headDate, result.check_runs, now, params.owner);
      }
    }

    if (Boolean(reason) !== marked && !dryRun) {
      // A worker may have advanced the PR since the initial list.
      const {data: current} = await github.rest.pulls.get({ ...params, pull_number: pull.number });
      if (!isInternalWork(current, repository) || current.head.sha !== pull.head.sha
          || labelsOf(current).includes(DELEGATED) !== selected
          || phasesOf(current).sort().join() !== phases.sort().join()) continue;
      const currentMarked = labelsOf(current).includes(ATTENTION);
      if (reason && !currentMarked) {
        await github.rest.issues.addLabels({ ...issue, labels: [ATTENTION] });
      } else if (!reason && currentMarked) {
        await github.rest.issues.removeLabel({ ...issue, name: ATTENTION });
      }
    }

    if (reason) overdue.push([pull.number, pull.head.sha.slice(0, 12), reason]);
  }

  core.summary.addHeading('Agent queue');
  if (overdue.length) {
    core.summary.addTable([
      ['PR', 'HEAD', 'Next action'].map(data => ({ data, header: true })),
      ...overdue.map(([number, sha, reason]) => [
        '<a href="' + context.serverUrl + '/' + repository + '/pull/' + number + '">#' + number + '</a>',
        sha,
        reason,
      ]),
    ]);
  } else {
    core.summary.addRaw('No overdue handoff for owner-delegated work.');
  }
  await core.summary.write();
  if (overdue.length && !dryRun) core.setFailed(overdue.length + ' overdue agent handoff(s)');
}

module.exports = { ATTENTION, DELEGATED, isInternalWork, stalledWork, monitor };
