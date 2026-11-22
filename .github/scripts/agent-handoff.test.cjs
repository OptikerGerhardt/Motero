'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {decide} = require('./agent-handoff-core.cjs');
const SHA = '0123456789abcdef0123456789abcdef01234567';
const defaults = {eventName:'issue_comment',action:'created',owner:'OptikerGerhardt',actor:'OptikerGerhardt',
  commentAuthor:'OptikerGerhardt',commentBody:'',headRepo:'OptikerGerhardt/Motero',
  repoFullName:'OptikerGerhardt/Motero',headSha:SHA,baseRef:'develop',prState:'open',
  labels:['agent:in-progress'],baseChanged:false};
const marker = state => '<!-- agent-handoff:v1 state=' + state + ' sha=' + SHA + ' -->';
const decideWith = x => decide({...defaults,...x});

test('trusted SHA-bound review -> needs-fix, also for draft PRs',()=>{
  assert.equal(decideWith({commentBody:marker('needs-fix')}),'agent:needs-fix');
});
test('successful reviewer handoff only from needs-review',()=>{
  assert.equal(decideWith({labels:['agent:needs-review'],commentBody:marker('review-passed')}),'agent:review-passed');
  assert.equal(decideWith({commentBody:marker('review-passed')}),null);
});
test('repair -> request a NEW independent review',()=>{
  assert.equal(decideWith({labels:['agent:needs-fix'],commentBody:marker('needs-review')}),'agent:needs-review');
  assert.equal(decideWith({labels:['agent:needs-fix'],commentBody:marker('review-passed')}),null);
});
test('reject stale SHA / malformed marker',()=>{
  assert.equal(decideWith({commentBody:'<!-- agent-handoff:v1 state=needs-fix sha='+'f'.repeat(40)+' -->'}),null);
  assert.equal(decideWith({commentBody:'needs-fix'}),null);
});
test('reject external author and forged sender',()=>{
  assert.equal(decideWith({actor:'stranger',commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({commentAuthor:'stranger',commentBody:marker('needs-fix')}),null);
});
test('reject forks, main targets, closed PRs',()=>{
  assert.equal(decideWith({headRepo:'attacker/Motero',commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({baseRef:'main',commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({prState:'closed',commentBody:marker('needs-fix')}),null);
});
test('new internal PR is assigned in-progress',()=>{
  assert.equal(decideWith({eventName:'pull_request_target',action:'opened',labels:[]}), 'agent:in-progress');
});
test('synchronize invalidates old approval but not active needs-fix',()=>{
  assert.equal(decideWith({eventName:'pull_request_target',action:'synchronize',
    labels:['agent:review-passed']}), 'agent:in-progress');
  assert.equal(decideWith({eventName:'pull_request_target',action:'synchronize',
    labels:['agent:needs-fix']}),null);
});
test('description edits without base changes do not erase approval',()=>{
  assert.equal(decideWith({eventName:'pull_request_target',action:'edited',
    labels:['agent:review-passed']}),null);
  assert.equal(decideWith({eventName:'pull_request_target',action:'edited',baseChanged:true,
    labels:['agent:review-passed']}),'agent:in-progress');
});
test('idempotent duplicate handoff and invalid transition',()=>{
  assert.equal(decideWith({labels:['agent:needs-fix'],commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({labels:['agent:review-passed'],commentBody:marker('needs-review')}),null);
});
test('valid first handoff from unlabeled PR',()=>{
  assert.equal(decideWith({labels:[],commentBody:marker('needs-fix')}),'agent:needs-fix');
});
test('no effect on unrelated events',()=>{
  assert.equal(decideWith({eventName:'push',commentBody:marker('needs-fix')}),null);
});

test('dedicated collaborator may hand off a SHA-bound finding',()=>{
  assert.equal(decideWith({actor:'OptikerLeergespart',commentAuthor:'OptikerLeergespart',
    commentBody:marker('needs-fix')}),'agent:needs-fix');
});
test('dedicated collaborator can request independent re-review, not approve from fix',()=>{
  assert.equal(decideWith({actor:'OptikerLeergespart',commentAuthor:'OptikerLeergespart',
    labels:['agent:needs-fix'],commentBody:marker('needs-review')}),'agent:needs-review');
  assert.equal(decideWith({actor:'OptikerLeergespart',commentAuthor:'OptikerLeergespart',
    labels:['agent:needs-fix'],commentBody:marker('review-passed')}),null);
});
test('reject spoofed author or other collaborator even if marker and SHA match',()=>{
  assert.equal(decideWith({actor:'OptikerLeergespart',commentAuthor:'OptikerGerhardt',
    commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({actor:'OptikerGerhardt',commentAuthor:'OptikerLeergespart',
    commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({actor:'untrustedCollaborator',commentAuthor:'untrustedCollaborator',
    commentBody:marker('needs-fix')}),null);
});
test('dedicated collaborator cannot touch main or use stale SHA',()=>{
  assert.equal(decideWith({actor:'OptikerLeergespart',commentAuthor:'OptikerLeergespart',
    baseRef:'main',commentBody:marker('needs-fix')}),null);
  assert.equal(decideWith({actor:'OptikerLeergespart',commentAuthor:'OptikerLeergespart',
    commentBody:'<!-- agent-handoff:v1 state=needs-fix sha='+ 'f'.repeat(40) +' -->'}),null);
});
