# Ticket Severity

Add severity to tickets.

Allowed values:

- low
- medium
- high
- critical

Requirements:

- New tickets default to medium.
- POST /tickets may optionally provide severity.
- Invalid severity returns HTTP 400.
- GET /tickets?severity=high filters by severity.
- Existing filters must continue to work.
- No new dependencies.
- Add automated tests.
