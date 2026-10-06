# Ticket Comments

## Goal

Users should be able to add comments to support tickets and retrieve
the comments for a ticket.

## Requirements

### POST /tickets/:id/comments

Request:

{
  "body": "Customer confirmed the issue."
}

Behavior:

- Return 404 if the ticket does not exist.
- body is required.
- body must be a string.
- whitespace-only comments are invalid.
- Valid comments receive a numeric incremental id.
- Store ticketId on the comment.
- Store comments only in memory.
- Return HTTP 201 for a successfully created comment.

Example response:

{
  "id": 1,
  "ticketId": 1,
  "body": "Customer confirmed the issue."
}

### GET /tickets/:id/comments

Behavior:

- Return 404 if the ticket does not exist.
- Return all comments belonging to that ticket.
- Preserve creation order.
- Return [] if the ticket exists but has no comments.

## Constraints

- No database.
- No new npm dependencies.
- Do not change the existing ticket API behavior.
- Do not change the analyzer interface.
- Keep the implementation simple.
- Add automated tests.
