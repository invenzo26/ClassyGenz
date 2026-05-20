# MVP Scoring Logic

## Engagement Score

The current MVP score is intentionally simple and explainable:

- `55%` from attendance ratio
- `25%` from presence heartbeat ratio
- `20%` from message activity

### Inputs

- Attendance ratio = attended minutes / planned session minutes
- Presence heartbeat ratio = `presence_ping` count compared to expected session heartbeat checkpoints
- Message activity = messages sent in the class during the session window

## Integrity Score

Integrity starts at `100` and deducts by event type:

- `tab_switch`: `-10`
- `camera_off`: `-20`
- `copy_paste`: `-10`
- `fullscreen_exit`: `-15`
- `multiple_face`: `-30`

`presence_ping` does not reduce integrity.

## MVP Philosophy

- The formula is rule-based, not predictive
- Teachers should be able to understand why a score changed
- Raw events remain visible so scores can be audited
