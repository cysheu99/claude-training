# AI Coding Prompt Playbook

**For Codex in Cursor + Claude Code**  
**Version:** 1.1 · 2026-10-07  
**Companion file:** `TRAINING_LOG.md` (record what you actually tried, outcomes, corrections, and measured usage)

> **Purpose:** Find your situation, decide whether to keep the conversation or start a fresh task, then paste a focused prompt. These are recommended templates from the training, **not proven winners from a controlled benchmark**. Update them using evidence recorded in `TRAINING_LOG.md`.

## How to use this file

- **Codex** means the **Codex extension inside Cursor**, not Cursor's built-in Agent/Grok.
- **Claude Code** means the terminal-based coding agent (`claude`), not the ordinary Claude chat website.
- Replace placeholders like `<requirements-file>`, `<feature>`, `<file>`, `<finding>`, `<baseline-branch>`, and `<command>` before pasting.
- Use the **Full / new-task** prompt when the agent has little relevant history. Use **Short / same-task** only when the earlier context really contains the plan or finding.
- **One task** can contain several turns: inspect → plan → implement → fix tests. Don't reset between turns in a single unfinished problem.
- A fresh reviewer should not inherit the implementation discussion. **Current requirements, code, and tests** are the source of truth.
- A shorter prompt is **not necessarily cheaper**: judge total usage, corrections, tool calls, and final correctness.

## 1-page situation finder

| # | Situation | Context | Find prompt |
|---|---|---|---|
| 01 | New medium/large feature | **New** | [Inspect + plan](#01-new-feature--inspect-and-plan) |
| 02 | Approve plan and implement | **Keep** | [Execute approved plan](#02-plan-approved--implement) |
| 03 | Plan is overengineered | **Keep** | [Simplify plan](#03-plan-overengineered--simplify) |
| 04 | Small obvious change | Either | [Tiny edit](#04-small-local-edit) |
| 05 | Requirement `.md` updated | **Keep**, usually | [Requirement delta](#05-requirement-changed-mid-feature) |
| 06 | Implement new requirement only | **Keep** | [Delta implementation](#06-implement-the-requirement-delta) |
| 07 | Large ticket, more agent freedom | **New** | [Bounded autonomy](#07-bounded-autonomy-for-a-complete-ticket) |
| 08 | Unknown bug | **Keep** through diagnosis/fix | [Reproduce bug](#08-bug--investigate-before-changing-code) |
| 09 | Root cause established | **Keep** | [Fix bug + regression test](#09-root-cause-confirmed--fix) |
| 10 | Test fails unexpectedly | **Keep** | [Failure triage](#10-tests-fail--determine-why) |
| 11 | Need tests / fake dependency | Keep or New | [Tests and fakes](#11-design-tests-and-test-doubles) |
| 12 | Implementation done, first review | **New** | [Independent review](#12-feature-complete--independent-review) |
| 13 | Review finding may be wrong | **Keep** | [Validate finding](#13-review-finding--confirm-or-reject) |
| 14 | One confirmed review finding | **Keep** | [Fix finding](#14-one-confirmed-review-finding--fix) |
| 15 | Many confirmed review findings | **Keep** while resolving | [Batch fixes](#15-many-review-findings--fix-only-accepted-ones) |
| 16 | Review fixes complete | **New** | [Fresh re-review](#16-review-fixes-complete--fresh-re-review) |
| 17 | Ready to merge | **New**, optional | [Final release gate](#17-final-merge-readiness-check) |
| 18 | Switching Codex ↔ Claude Code | **New** | [Cross-agent handoff](#18-cross-agent-handoff) |
| 19 | Long task, need to resume later | New or same | [Checkpoint / resume](#19-long-work--write-a-handoff-or-resume) |
| 20 | Agent starts changing unrelated code | **Keep** | [Stop scope creep](#20-agent-expanded-scope--stop-and-reassess) |
| 21 | Need explanation, not code | Either | [Teach / trace](#21-learn-without-delegating-the-change) |
| 22 | Need concise progress/results | **Keep** | [Status report](#22-request-a-concise-progress-or-completion-report) |
| 23 | Compare token/context strategies | Separate comparable runs | [Measure efficiency](#23-measure-token-and-context-efficiency) |
| 24 | Don't know if you should clear | Decision rule | [Keep or reset](#24-should-i-start-a-new-task) |
| 25 | Same task, context getting large | **Keep + compact** | [Compact](#25-same-task-but-context-is-getting-large) |
| 26 | Need the exact session transcript | Same task | [Export](#26-need-the-exact-session-transcript) |
| 27 | Need a quick reminder of session state | Same task | [Recap](#27-need-a-quick-session-reminder) |
| 28 | Want evidence about context/usage | Same task | [Context + usage](#28-inspect-context-and-usage) |

### Core prompting formula

```text
GOAL — what behavior or result is needed?
SOURCE OF TRUTH — which requirement/file is authoritative?
BOUNDARIES — what must NOT change?
VERIFICATION — which behavior/tests prove success?
OUTPUT — what do you want reported, and how much detail?
```

For trivial edits, skip a separate planning round. For complex changes, review the plan before delegating implementation.

---

# A. Features, scope, and requirement changes

## 01. New feature — inspect and plan

**Use:** New feature with architectural decisions. **Context:** New task. **Mode:** Read-only/planning.

**Codex — Full / new task**

```text
The authoritative requirement is <requirements-file>.

Do not modify any files yet.
Inspect only the code and tests relevant to this feature, then propose the
smallest implementation plan consistent with the current architecture.

Include: files affected, data flow, validation/edge cases, and tests.
Do not add dependencies or redesign unrelated code without a concrete reason.
Keep the plan concise; stop before implementation.
```

**Claude Code — Full / new task**

```text
Read <requirements-file> and investigate the relevant existing implementation.
Do not edit files yet.

Give me a concise plan: files, data flow, edge cases, verification.
Prefer the smallest change consistent with the current design.
Stop after the plan so I can review it.
```

**Short / same task:** `Plan the smallest implementation for <feature>. No edits yet; include tests and edge cases.`

**Why:** The requirement stays outside the conversation; the plan can be reviewed without spending tokens on implementation first.

## 02. Plan approved — implement

**Use:** You have approved the plan in **this** conversation. **Context:** Keep task.

**Codex**

```text
Proceed with the approved plan.

Implement the required behavior, add relevant tests, and run them.
You may investigate and fix failures caused by your changes.
Stay within scope; preserve existing behavior; avoid unrelated refactors.

Report only: files changed, tests run/results, unresolved issues.
```

**Claude Code (shorter continuation)**

```text
Implement the approved plan. Keep the diff scoped and preserve existing behavior.
Add/run relevant tests and fix failures caused by your changes.
Summarize changed files, test results, and blockers briefly.
```

**Short / same task:** `Proceed. Keep changes scoped, verify with tests, and report blockers only.`

**Don't:** Paste the full requirement and plan again if the agent already has them. A prompt granting edits does **not** override the actual agent's permissions.

## 03. Plan overengineered — simplify

**Use:** Plan introduces extra services, frameworks, layers, or unrelated refactors. **Context:** Keep.

**Codex**

```text
Simplify the proposed plan.
Optimize for the current requirement and existing project size.
Remove abstractions that only serve hypothetical future needs.
Explain any remaining new file or dependency by its immediate benefit.
Do not edit yet. Show the revised minimal plan.
```

**Claude Code**

```text
Simplify this plan to the smallest maintainable change that meets the current spec.
Avoid speculative abstractions. Briefly justify any new dependency or layer.
No edits yet.
```

**Short:** `Simplify for today's requirements. No speculative layers or dependencies. Reissue the plan only.`

## 04. Small local edit

**Use:** Known file/function, low-risk change. **Context:** Same or new; no elaborate planning required.

**Codex**

```text
In <file>, change <old behavior> to <new behavior>.
Make only the necessary local edit. Preserve unrelated behavior.
Run the most relevant check and report the result briefly.
```

**Claude Code**

```text
Make the smallest change in <file> so that <desired behavior>.
Avoid unrelated edits. Verify the behavior and report briefly.
```

**Short:** `<file>: make <specific edit> only. Verify it.`

**Why:** A multi-turn plan-review cycle can cost more than the change itself.

## 05. Requirement changed mid-feature

**Use:** You edited `tickets/*.md` after the first implementation started. **Context:** Usually keep the feature task.

**Codex**

```text
I updated <requirements-file>; the current file is authoritative.
Do not modify code yet.
Start with the requirement-file diff and examine surrounding lines only as needed.
Summarize exactly what was added, removed, or changed, then identify the
minimal implementation/test delta. Do not reconsider unchanged requirements.
```

**Claude Code**

```text
<requirements-file> has changed and supersedes earlier assumptions.
Review its diff first; inspect surrounding requirements only as needed.
No code edits. Tell me the behavior change and minimal code/test delta.
```

**Short:** `Spec updated: <requirements-file>. Read its diff; propose only the implementation/test delta. No edits yet.`

**Git nuance:** `git diff -- <file>` shows **unstaged changes**, not an update already committed. If the spec update was committed, compare the relevant commits (e.g., `git diff <old-commit>..<new-commit> -- <file>`). An **untracked new file** won't appear in ordinary `git diff`; open it directly or stage it first and inspect `git diff --cached`.

## 06. Implement the requirement delta

**Use:** New requirement understood and delta plan approved. **Context:** Keep.

**Codex**

```text
Implement only the approved requirement delta in <requirements-file>.
Preserve all already-correct behavior. Add/update the tests needed for the delta.
Do not refactor unchanged functionality. Run relevant tests, then the full suite.
Report changed files, test results, and any unresolved requirement.
```

**Claude Code**

```text
Implement only the approved spec delta. Preserve existing behavior.
Add the regression test, run relevant tests and the full suite.
Keep the change scoped; report blockers.
```

**Short:** `Implement the agreed delta only, add its tests, and verify. No unrelated changes.`

## 07. Bounded autonomy for a complete ticket

**Use:** Codex/Claude Code is ready to do the whole ticket after you define acceptance criteria. **Context:** Usually new task, or keep the plan task after approval.

**Codex**

```text
Implement <requirements-file> end to end.
Use the current application architecture.

You may inspect relevant files, edit code, add tests, run commands, and fix
failures caused by your work. Make reasonable local implementation decisions.

Do not expand scope, weaken tests to pass, add unnecessary dependencies,
or refactor unrelated code. Preserve existing behavior.

When finished, report: changed files, verification, unresolved requirements.
```

**Claude Code**

```text
Implement <requirements-file> end to end. Follow the existing architecture.
Keep changes scoped, add/run tests, and fix implementation-caused failures.
Avoid unrelated refactors and dependencies.
Return a concise summary of changed files, verification, and blockers.
```

**Short:** `Implement <requirements-file> end to end; preserve existing behavior, test, and report blockers.`

---

# B. Debugging and testing

## 08. Bug — investigate before changing code

**Use:** You know the symptom but not the root cause. **Context:** Keep until fixed.

**Codex**

```text
Bug: <symptom + reproduction steps>.
Do not change code or tests yet.
Reproduce the failure with the smallest relevant command/test, inspect the
related code, and identify the root cause from evidence.
Distinguish observed facts from hypotheses. Stop before editing.
```

**Claude Code**

```text
Investigate <bug>. No edits yet.
Reproduce it, show the failing behavior, and explain the evidence-backed root cause.
Do not guess or broaden the investigation unless needed.
```

**Short:** `Reproduce <bug> and explain root cause with evidence. No edits.`

## 09. Root cause confirmed — fix

**Use:** Bug has been reproduced/diagnosed. **Context:** Keep.

**Codex**

```text
Fix the confirmed root cause: <root cause>.
Make the smallest correct change. Add a regression test that detects the
original failure. Do not weaken existing assertions or refactor unrelated code.
Run the relevant tests and report results.
```

**Claude Code**

```text
Fix the confirmed root cause with a minimal change and a regression test.
Preserve behavior elsewhere. Run relevant tests and report results briefly.
```

**Short:** `Fix the confirmed cause, add a regression test, and verify.`

**Note:** A regression test ideally fails before the fix; when practical, observe that before applying the change.

## 10. Tests fail — determine why

**Use:** Unknown failing test or inconsistent CI result. **Context:** Keep.

**Codex**

```text
The following test fails: <command / failure excerpt>.
Do not change production code or test expectations yet.
Determine whether this is a product bug, incorrect test expectation,
state leakage, environment/setup failure, or unrelated regression.
Provide evidence and the smallest next action. Stop before editing.
```

**Claude Code**

```text
Investigate <test failure>. No edits yet.
Classify the cause (implementation, test, state, or environment),
show evidence, and recommend the smallest fix.
```

**Short:** `Diagnose <failure>. No edits or weakened assertions until the cause is clear.`

## 11. Design tests and test doubles

**Use:** Need behavior-focused tests or injectable fake implementation. **Context:** Usually keep, unless doing an independent test-design pass.

**Codex**

```text
Inspect <requirements-file> and the relevant test setup.
Do not edit yet. Propose the smallest behavior-focused tests for <feature>.
If a dependency is external or nondeterministic, propose a simple fake/mock
that matches its interface without network calls.
Avoid testing private implementation details. Show the test cases only.
```

**Claude Code**

```text
Propose minimal tests for <feature> based on observable behavior.
Use an injected deterministic fake if a dependency would make tests slow,
expensive, or flaky. No edits yet.
```

**After approval (either agent):**

```text
Implement the approved tests. Preserve valid existing assertions.
Do not call real external APIs in unit tests. Run the full suite and summarize results.
```

---

# C. Code review and iterative review fixes

## 12. Feature complete — independent review

**Use:** Implementation and tests are ready for a fresh set of eyes. **Context:** **NEW** task; optionally switch agents.

**Codex**

```text
Act as an independent reviewer. Do not modify files.
Treat <requirements-file> as authoritative.
Review the current feature changes against the spec; inspect relevant
surrounding code and tests only as necessary.

Identify definite correctness bugs, unmet requirements, regressions,
important missing tests, and material complexity—not style preferences.
For each definite finding, give file/location, impact, and reproduction evidence.
Separate definite issues from optional suggestions. Be concise.
```

**Claude Code**

```text
Independently review the changes for <requirements-file>. No edits.
Start from the feature diff and inspect surrounding code/tests only as needed.
Report actionable correctness issues or unmet requirements with file/location
and evidence. Separate definite defects from optional suggestions; ignore style.
```

**Short:** `Independently review current feature diff vs <requirements-file>. No edits. Actionable bugs/missing tests only, with evidence.`

**Diff caution:** If changes are already committed on a feature branch, `git diff` may appear empty. Use a meaningful baseline (e.g., `git diff <baseline-branch>...HEAD`) **and** inspect uncommitted/untracked work. Let the agent select the correct comparison after verifying branch state; don't assume `main` always exists locally.

## 13. Review finding — confirm or reject

**Use:** Reviewer claims an issue; you're not sure it's real. **Context:** Keep review task.

**Codex**

```text
Verify this specific review finding before editing:
<finding>

Produce a minimal reproduction or failing test if possible.
Explain whether it violates <requirements-file>, with evidence.
If it is not reproducible, say so. No changes yet.
```

**Claude Code**

```text
Check whether <finding> is a real defect against <requirements-file>.
Reproduce or disprove it with the smallest relevant test. No edits yet.
```

**Short:** `Validate <finding> with evidence. No edits until confirmed.`

## 14. One confirmed review finding — fix

**Use:** Confirmed issue from the review. **Context:** Keep.

**Codex**

```text
Fix only this confirmed review issue: <finding>.
Preserve unrelated behavior. Add/update a regression test as appropriate.
Do not apply optional review suggestions. Run relevant tests and report results.
```

**Claude Code**

```text
Make the smallest fix for <finding> and add its regression test.
No optional cleanup. Verify and summarize briefly.
```

**Short:** `Fix <finding> only, add its regression test, run tests.`

## 15. Many review findings — fix only accepted ones

**Use:** Reviewer found a long list; you approved specific items. **Context:** Keep while resolving the accepted findings; create a small handoff file if moving agents.

**Codex**

```text
Address ONLY the accepted findings in <review-handoff-file>.
Treat <requirements-file> as authoritative.
For each finding: verify/reproduce, make the smallest fix, and add a regression
test when appropriate. Preserve unrelated code and do not implement optional ideas.
Run the full test suite after the accepted findings are resolved.
Report resolved items, unresolved items, and test results.
```

**Claude Code**

```text
Resolve the accepted findings in <review-handoff-file> against <requirements-file>.
Keep fixes minimal, add regression tests where useful, ignore optional suggestions.
Run the full suite; report what's resolved and blocked.
```

**Short:** `Fix only the accepted findings in <review-handoff-file>; regression tests + full suite. No optional cleanup.`

**Why a handoff file?** It saves *decisions* (accepted/rejected findings), rather than making another agent rediscover a long review conversation.

## 16. Review fixes complete — fresh re-review

**Use:** All accepted review fixes done and tests pass. **Context:** **NEW** task.

**Codex**

```text
Act as a fresh independent reviewer. Do not modify files.
<requirements-file> is authoritative.
Review the CURRENT implementation from scratch, including recent review fixes.
Do not assume previous findings were fixed correctly.
Look for remaining unmet requirements, correctness bugs, regressions from fixes,
and high-value missing tests. Ignore style-only comments.
Give file/location + evidence for definite issues; separate optional suggestions.
Keep it concise.
```

**Claude Code**

```text
Fresh independent re-review of the current implementation vs <requirements-file>.
No edits. Do not trust prior review outcomes.
Report only remaining actionable defects, regressions, or important missing tests
with evidence and locations; optional suggestions separately.
```

**Short:** `Fresh re-review vs <requirements-file>. No edits; don't assume prior fixes are correct. Actionable issues only.`

## 17. Final merge-readiness check

**Use:** You believe the feature is done, after reviews. **Context:** New task optional; run actual checks yourself too.

**Codex**

```text
Perform a final merge-readiness check. Do not modify files.
Compare the current feature against <requirements-file> and verify test results.
Report only merge-blocking unmet requirements, correctness problems, security
issues, or meaningful missing regression coverage. No speculative redesign.
If none are found, say "No blocking issues found in this review" and state
what was actually checked (not a guarantee of correctness).
```

**Claude Code**

```text
Check release readiness for <requirements-file> without editing.
Run/inspect the relevant checks and current diff. Report only genuine blockers,
with evidence; otherwise state what you verified and remaining uncertainty.
```

**Short:** `Final no-edit merge check vs <requirements-file>. Blocking issues only; state exactly what was verified.`

---

# D. Handoffs, teaching, and context control

## 18. Cross-agent handoff

**Use:** Codex implements → Claude Code reviews, or vice versa. **Context:** New task for recipient.

**Codex — receiving work from Claude Code**

```text
You're taking over an existing feature. Use the CURRENT repo as source of truth.
Requirement: <requirements-file>.
Handoff notes (accepted decisions/blockers): <handoff-file>.

Inspect only the relevant code/tests and <specific goal>.
Do not assume access to the previous Claude Code conversation.
Before editing, briefly confirm your understanding of what is complete and what
remains. Avoid reopening settled design decisions without evidence.
```

**Claude Code — receiving work from Codex**

```text
Continue from the CURRENT code/tests, not Codex's conversation history.
Read <requirements-file> and <handoff-file>, then inspect relevant files.
Your goal is <specific next task>.
Briefly state the remaining work before editing; don't redo settled work.
```

**Short:** `Use current code/tests + <requirements-file> + <handoff-file>. Goal: <specific next step>. Do not assume prior chat context.`

**Handoff file format (keep under ~20 lines when possible):**

```text
Goal:
Source of truth:
Completed and verified:
Accepted decisions:
Known failure / exact command:
Remaining work:
Do-not-change constraints:
```

## 19. Long work — write a handoff or resume

**Use:** You must stop before the task's important conclusions are saved in code. **Context:** Keep session if still available; otherwise new task + handoff.

**Codex**

```text
Create a short handoff for this unfinished task in <handoff-file>.
Include only: current goal, verified findings, files involved, decisions made,
commands/results, blockers, and next action. Distinguish facts from hypotheses.
Do not include a full conversation transcript or secrets.
```

**Claude Code**

```text
Write a concise checkpoint to <handoff-file> for resuming this task.
Capture verified facts, affected files, decisions, failing commands,
and the exact next step. Omit irrelevant history and secrets.
```

**New task to resume (either):**

```text
Resume <goal> from <handoff-file> and the current repo.
Confirm the current state with minimal checks, then take the next unfinished step.
Do not redo completed work unless verification shows it is broken.
```

## 20. Agent expanded scope — stop and reassess

**Use:** Agent started unnecessary package installs, refactors, or unrelated changes. **Context:** Keep.

**Codex**

```text
Stop making changes.
Compare your changes with <requirements-file>.
Identify required vs unrelated edits, with file names and reasons.
Do not revert or modify anything yet. Propose how to reduce the diff safely.
```

**Claude Code**

```text
Pause edits. Compare the current diff with <requirements-file>.
List out-of-scope changes and recommend how to remove them safely.
Don't modify or revert anything until I review.
```

**Short:** `Stop edits. Identify required vs unrelated changes against <requirements-file>. No revert yet.`

## 21. Learn without delegating the change

**Use:** You want to understand a concept or trace behavior yourself. **Context:** Either.

**Codex**

```text
I'm learning <concept>; do not modify my repository.
Explain it using a small unrelated example, then point to the relevant code in
this project. Give me enough guidance to implement it myself, not a full patch.
Keep the explanation under 200 words.
```

**Claude Code**

```text
Teach me <concept> using a tiny example. No file edits.
Then identify where it applies in this repo; let me write the change myself.
Keep it concise.
```

**Targeted trace (either):** `No edits. Trace <request/function> from <entry point> to <result>, citing relevant files only.`

## 22. Request a concise progress or completion report

**Use:** Agent has done work and you want information, not another long explanation. **Context:** Keep.

**Codex**

```text
Summarize current task status in at most 120 words:
- completed behavior
- files changed
- tests actually run and results
- open blockers
Do not claim tests passed if they were not run. No edits.
```

**Claude Code**

```text
Concise status only: what's done, changed files, actual test results,
and blockers. No edits or extra suggestions.
```

**Short:** `Status only: done, changed files, tests actually run, blockers. No edits.`

## 23. Measure token and context efficiency

**Use:** At the end of comparable tasks, for `TRAINING_LOG.md`. **Context:** New analysis task only if helpful; **do not** load training log into every coding task.

**Codex**

```text
Summarize this task for TRAINING_LOG.md using observed evidence only:
- goal and outcome
- prompts/turns required
- tool calls or repeated exploration that seemed unnecessary
- corrections/retries
- tests actually run
- token/cached-token/cost data ONLY if available from the interface
Clearly mark unavailable metrics as N/A. Do not guess numbers. No edits.
```

**Claude Code**

```text
Give me a factual training-log summary: result, tests, corrections, unnecessary
file reads, and available session usage/cache statistics. Mark unknown values N/A.
Do not estimate token counts. No edits.
```

**Measure the right thing:** total input + output + cache reads/writes when exposed; cost when available; wall-clock time; genuine defects; number of retries; and tests passing. **Cached tokens still occupy context**, and a fresh task can lose some cache reuse. Don't claim that one approach saved money based on context occupancy alone.

**Evidence template:**

| Metric | Run A | Run B |
|---|---|---|
| Agent/model | | |
| Equivalent task/acceptance criteria? | | |
| Input tokens (if available) | | |
| Cached input / cache writes (if available) | | |
| Output tokens (if available) | | |
| Estimated cost (if available) | | |
| Tools/file reads | | |
| Corrections/retries | | |
| Tests/acceptance satisfied? | | |
| Correctness findings | | |

A single comparison is anecdotal. Repeat across several comparable tasks before declaring a prompt pattern 'best'.

## 24. Should I start a new task?

```text
Same unresolved goal, and prior findings are useful?  → KEEP TASK.
Plan discussed but not implemented/documented?     → KEEP, or write handoff.
Bug reproduced but not fixed?                      → KEEP TASK.
Feature implemented + verified?                   → NEW task for independent review.
Many review fixes completed?                      → NEW task for re-review.
Completely unrelated goal?                        → NEW TASK.
Handoff between agents?                           → NEW task + short saved context.
```

**Codex short resume:** `Continue the current investigation using findings already established. Next: <step>. Don't repeat broad exploration.`

**Claude Code short resume:** `Continue from the findings in this session. Next: <step>. Read more files only as needed.`

**New-task reset:** `Treat the current requirements, code, and tests as authoritative. Focus on <new goal>. Do not rely on assumptions from an earlier conversation.`

### Prompt caching reminder

- For Codex and Claude Code, prompt caching is handled by the underlying supported model/tooling; **typing “please cache this” in a prompt does not enable caching**.
- Keeping a useful ongoing conversation can make its unchanged prefix eligible for cache reuse, but a hit is **not guaranteed**.
- A fresh conversation often reduces irrelevant carried context, but may require rereading files. Optimize *successful outcomes per total usage/cost*, not just raw prompt length or cache-hit rate.
- Stable project guidance helps; don't continually rewrite persistent instructions or put dynamic timestamps before large stable context.

## 25. Same task but context is getting large

**Use:** You are still solving the same unresolved problem, but the conversation has accumulated lots of tool output, explanations, or failed attempts. **Context:** Keep the task; compact it.

**Claude Code command:**

```text
/context all
/compact Preserve:
- the current goal
- confirmed findings/root cause
- relevant files
- decisions already approved
- current failing test or blocker
```

Then run `/context all` again and compare. `/compact` summarizes the conversation so you can continue the same task with less context.

**Prompt after compacting:**

```text
Continue from the compacted findings.
Next: <specific next step>.
Do not repeat broad repository exploration unless needed.
```

**Do not compact just to chase a lower number.** If the prior reasoning is short and useful, simply keep the task.

## 26. Need the exact session transcript

**Use:** You want evidence of what the agent actually investigated, planned, changed, or said. `/context` and `/usage` do not provide a semantic transcript.

**Claude Code command:**

```text
/export
```

Or write directly to a file:

```text
/export docs/claude-session.txt
```

**Use the export for:**
- auditing what happened in a training experiment;
- comparing two workflows;
- recovering exact prompts/tool decisions;
- making a handoff when the conversation itself matters.

**Token note:** Do not routinely feed the exported transcript back into another agent. Prefer current code/tests/specs or a short handoff; full transcripts can be very token-heavy.

## 27. Need a quick session reminder

**Use:** You want a lightweight reminder of the current session before continuing, not a full transcript.

**Claude Code command:**

```text
/recap
```

`/recap` generates a one-line summary of the current session. Use it as orientation, not as a substitute for requirements, tests, or an explicit handoff.

**If you need a structured handoff instead, ask:**

```text
No edits. Summarize the current task in under 120 words:
- goal
- confirmed decisions/findings
- files changed
- tests/results
- remaining blocker or next step
```

## 28. Inspect context and usage

**Use:** You want evidence for token/context efficiency.

**Claude Code commands:**

```text
/context all
/usage
```

Use `/context all` to inspect **current context occupancy**. Use `/usage` for the usage/activity statistics your account/version exposes. They answer different questions.

Record only values you can actually observe:

```text
Context before:
Context after:
Usage before:
Usage after:
Corrections/retries:
Tests passed:
Unnecessary exploration:
```

Do not infer exact cache-read/cache-write token counts unless the interface actually shows them. Context occupancy is not cumulative token usage.

---

# E. Lesson 9 summary — token efficiency and prompt caching

## What to optimize

Do **not** optimize for the shortest prompt or the highest cache-hit percentage. Optimize for:

```text
minimum total context + model usage + retries + human corrections
needed to complete the task correctly
```

A slightly longer, well-scoped prompt that succeeds on the first attempt can be cheaper than a short ambiguous prompt that creates several repair turns.

## Context strategy

```text
Same unresolved problem + useful prior reasoning
→ KEEP the task

Same unresolved problem + context becoming bloated
→ /compact

Goal changed + useful result now lives in code/tests/spec/docs
→ /clear and start fresh

Need to return to an old conversation
→ /resume
```

## Cache-friendly behavior

You do not tell Codex or Claude Code “use prompt caching.” Instead:

1. Keep stable project instructions stable.
2. Keep the same model/tools/settings during one task unless there is a reason to change them.
3. Append concise follow-up instructions instead of restating the entire requirement every turn.
4. Put stable reusable material before variable material when designing your own API prompts.
5. Avoid dynamic timestamps/IDs near the beginning of a large stable prompt prefix.
6. Do not retain irrelevant history solely to improve the cache-hit rate. Removing unnecessary context is better than cheaply caching unnecessary context.

**Cache-friendly continuation:**

```text
Implement the approved plan.
Keep changes scoped and run relevant tests.
Report blockers only.
```

Instead of repeating the full requirement, architecture, and project rules that are already in the current task.

## Input vs output caching

Prompt caching applies to **reused input prefixes**. Output is generated again. When an API exposes cache metrics, distinguish:

```text
uncached input
cache creation/write input
cache read input
output tokens
```

Do not refer to “cached output tokens.”

## Session commands quick reference (Claude Code)

| Need | Command | Meaning |
|---|---|---|
| See what's filling context | `/context all` | Current context occupancy/breakdown |
| See available usage statistics | `/usage` | Session/account usage data exposed by your version |
| Same problem, context too large | `/compact [instructions]` | Summarize history and continue |
| New goal, old history no longer useful | `/clear [name]` | Start a new conversation with empty context |
| Return to a prior conversation | `/resume` | Resume a saved conversation |
| Exact transcript | `/export [filename]` | Export current conversation as plain text |
| Quick orientation | `/recap` | One-line summary of current session |

## Lesson 9 rule to remember

```text
REMOVE irrelevant context
        ↓
KEEP useful context
        ↓
COMPACT useful-but-bloated context
        ↓
CACHE stable repeated input
```

Prompt caching comes **after** good context management.

---

# F. Project setup and review mechanics

## Persistent instructions: which file goes where?

| Surface | Project guidance file | Recommended content |
|---|---|---|
| **Codex** | `AGENTS.md` | Minimal repo conventions, commands, architecture constraints |
| **Claude Code** | `CLAUDE.md` | Minimal repo conventions, commands, architecture constraints |
| **Both** | `tickets/*.md` | Actual feature-specific requirements and acceptance criteria |
| **Your own records** | `TRAINING_LOG.md` | Observed outcomes, prompts, corrections, actual measured usage |
| **Your personal reference** | `PROMPT_PLAYBOOK.md` | Reusable prompts; **do not auto-load the entire file each task** |

`AGENTS.md` and `CLAUDE.md` are conventionally read by their respective agents. They are not substitutes for a feature specification. Keep them short and synchronized on shared project rules if you use both agents.

**Suggested tiny project rules (adjust to actual repo):**

```text
- Stack: Node.js, JavaScript ES modules, Express.
- Run tests with `npm test`.
- Preserve existing route behavior unless the ticket changes it.
- Prefer small changes and behavior-focused tests.
- Never expose .env values or credentials.
- Do not read node_modules or the entire lockfile unless needed.
```

## Git checks before / after agent work

```bash
# Before work
git status
npm test

# While reviewing
git status
git diff
git diff --cached

# If feature changes have been committed, compare a verified baseline:
git diff <baseline-branch>...HEAD

# Always inspect new untracked files shown in git status
# Before commit
git status
git diff --cached --stat
```

`git diff` alone is not a complete review of staged, committed, and untracked changes. Confirm the correct base branch and inspect the actual relevant files.

**Security guard:** Never paste real keys into chat; exclude `.env` and credential files from Git commits. Treat terminal output containing secrets as sensitive too.

## How to improve this playbook

1. Copy a template and replace placeholders; do not paste the entire playbook into the agent.
2. Record the **actual prompt**, model, context strategy, outcome, test results, and usage (if available) in `TRAINING_LOG.md`.
3. When a better variant repeatedly works on comparable tasks, update the corresponding template here.
4. If a template creates unnecessary exploration or repeated explanation, shorten it **without removing the requirement or verification criterion**.
5. Reserve independent fresh reviews for meaningful changes, not every one-line edit.

---

## Training-specific examples

**Your current project:** `~/code/claude-training`  
**Example specification:** `tickets/lesson-8-status-history.md`

**Fastest useful prompts:**

```text
# Plan
Read tickets/lesson-8-status-history.md and plan the smallest implementation.
No edits yet; include relevant tests.

# Implement (same conversation)
Implement the approved plan, keep scope tight, run tests, report blockers.

# Requirement delta (same conversation)
The spec changed. Read its diff, explain the minimal code/test delta. No edits yet.

# Review (new conversation)
Independently review current changes vs tickets/lesson-8-status-history.md.
No edits; report only evidence-backed bugs or unmet requirements.

# Re-review after fixes (new conversation)
Fresh review against the current spec. Do not assume previous fixes were correct.
No edits; report actionable regressions and remaining issues.
```

### Further reading (optional)

- Codex project instructions (`AGENTS.md`): https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- Codex prompting/context discipline: https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra
- OpenAI prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Claude Code documentation: https://code.claude.com/docs/en/overview

**Bottom line:** Keep the conversation while you're solving one problem; reset when the problem is complete and the next task can reconstruct what it needs from current code, tests, and specs. The best prompt is the shortest one that still makes success and scope unambiguous.
