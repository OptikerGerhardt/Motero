'use strict';

// Pure, deterministic transition policy. No network access and no code execution.
const PHASES = Object.freeze([
  'in-progress', 'needs-review', 'needs-fix',
  'review-passed', 'ready-for-human-review', 'blocked'
]);
const AGENT_LABELS = PHASES.map(p => 'agent:' + p);
const ALLOWED = Object.freeze({
  '(none)': ['agent:in-progress', 'agent:needs-fix', 'agent:blocked'],
  'agent:in-progress': ['agent:needs-review','agent:needs-fix','agent:blocked'],
  'agent:needs-review': ['agent:needs-fix','agent:review-passed','agent:blocked'],
  'agent:needs-fix': ['agent:needs-review','agent:blocked'],
  'agent:review-passed': ['agent:ready-for-human-review','agent:needs-fix'],
  'agent:ready-for-human-review': ['agent:needs-fix'],
  'agent:blocked': ['agent:in-progress','agent:needs-review']
});
function decide({eventName, action, owner, actor, commentAuthor, commentBody,
                 headRepo, repoFullName, headSha, baseRef, prState, labels, baseChanged}) {
  if (prState !== 'open' || !headRepo || headRepo !== repoFullName) return null;
  if (!(baseRef === 'develop' || baseRef.startsWith('feature/'))) return null;
  const active = labels.filter(label => AGENT_LABELS.includes(label));
  if (eventName === 'issue_comment') {
    if (actor !== owner || commentAuthor !== owner || typeof commentBody !== 'string') return null;
    const marker = commentBody.match(/<!--\s*agent-handoff:v1\s+state=(in-progress|needs-review|needs-fix|review-passed|ready-for-human-review|blocked)\s+sha=([0-9a-f]{40})\s*-->/);
    if (!marker || marker[2] !== headSha) return null;
    const desired = 'agent:' + marker[1];
    const from = active.length === 1 ? active[0] : '(none)';
    if (from === desired) return null;
    return (ALLOWED[from] || []).includes(desired) ? desired : null;
  }
  if (eventName === 'pull_request_target') {
    if (action === 'opened' && active.length === 0) return 'agent:in-progress';
    if (action === 'reopened' && (active.length === 0 || active.includes('agent:review-passed') ||
        active.includes('agent:ready-for-human-review'))) return 'agent:in-progress';
    if (action === 'synchronize' || (action === 'edited' && baseChanged === true)) {
      if (active.includes('agent:needs-review') || active.includes('agent:review-passed') ||
          active.includes('agent:ready-for-human-review')) return 'agent:in-progress';
    }
  }
  return null;
}
module.exports = {PHASES, AGENT_LABELS, decide};
