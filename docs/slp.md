# The SLP as a procedural state machine

A Special Leave Petition is not a document to generate. It is a procedure. Each state has guards: conditions over the verified record, the citation verdicts and the Case Conference decisions. A transition happens only when every guard passes, and the transition is a ledger event that records each guard's result.

The document (synopsis and list of dates, petition, grounds, annexure index, affidavit, declaration) is a view of the machine's data at the end, not something written by a model.

## States

```mermaid
stateDiagram-v2
  [*] --> intake
  intake --> record: matter-complete
  record --> facts: impugned-order-present, impugned-order-certified
  facts --> limitation: dates-verified, parties-verified
  limitation --> authorities: within-limitation or condonation-sought
  authorities --> grounds: citations-verified
  grounds --> compliance: questions-of-law-accepted, grounds-accepted
  compliance --> declaration: defects-clear
  declaration --> filed: receipt-signed, ai-disclosure
  filed --> defects_notified: registry finds defects
  defects_notified --> compliance: advocate cures
  filed --> registered: registry accepts
```

| State | The advocate is | Leaves when |
|---|---|---|
| `intake` | Describing the matter: impugned order, court, date, custody | Matter has every required field |
| `record` | Adding the impugned order and annexures | The impugned order is a source, and it is a certified copy |
| `facts` | Confirming the Notebook's dates and parties | Every date and party extract is `confirmed`, none failed or unresolved |
| `limitation` | Seeing the computed limitation | Filed within the limitation period from the impugned order, or a condonation application is recorded |
| `authorities` | Clearing the citation verifier | No citation failed or unresolved at identity, pinpoint or standing |
| `grounds` | Running Case Conferences | At least one question of law and one ground accepted, each with every grounding verified |
| `compliance` | Clearing the defect checker | No defect from the Supreme Court rules pack |
| `declaration` | Signing | Receipt signed and the AI-use declaration recorded |
| `filed` | Waiting on the registry | Registry returns defects or a diary number |

## Defect rules

Rules live as data in `packages/pleading/rules/sc-slp.json`. Each has a code, the rule it enforces, and the check that tests it. The same file is used by the workspace before filing and by the simulated registry after filing.

Each rule's `rule` reference must be checked against the text of the Supreme Court Rules, 2013 and the Court's current practice directions before release. Rules not yet checked carry `"confirmed": false`.

## Why a state machine

- **No skipped steps.** The pleading cannot reach `grounds` with an unverified citation, because the transition's guard reads the verifier's verdicts.
- **Change is safe.** If a confirmed date is later rejected, the guard for `facts` fails on the next evaluation and the advocate sees exactly which step reopened.
- **The audit trail is the procedure.** Each transition records which guards passed, so the receipt can show what was checked before filing.
