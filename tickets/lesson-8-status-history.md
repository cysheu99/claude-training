# Lesson 8: Ticket Status History

## Goal

Allow users to update a ticket's status and retrieve
its status-change history.

## Feature 1: Update Ticket Status

Endpoint:

PATCH /tickets/:id/status

Request:

{
  "status": "in_progress"
}

Allowed statuses:

- open
- in_progress
- closed

Requirements:

1. Return 404 if the ticket does not exist.
2. Return 400 for an invalid status.
3. Return 400 if status is missing or not a string.
4. Update the ticket's status.
5. Return the updated ticket with HTTP 200.
6. Record status changes in memory.
7. If the requested status matches the ticket's current status, return the
   unchanged ticket with HTTP 200 and do not create a history record.

## Feature 2: Status History

Endpoint:

GET /tickets/:id/history

Requirements:

1. Return 404 if the ticket does not exist.
2. Return an empty array if no status changes exist.
3. Return status changes in chronological order.
4. Each history record contains:

- id
- ticketId
- from
- to
- changedAt

5. changedAt must be an ISO 8601 timestamp.
6. Each ticket has its own history.
7. History IDs increment numerically.

Example:

[
  {
    "id": 1,
    "ticketId": 1,
    "from": "open",
    "to": "in_progress",
    "changedAt": "2026-10-06T10:00:00.000Z"
  }
]

## Constraints

- Use in-memory storage.
- No database.
- No new npm dependencies.
- Preserve existing ticket APIs.
- Preserve the analyzer dependency-injection design.
- Do not change comment functionality.
- Add automated tests.
