import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

let app;

beforeEach(() => {
  app = createApp();
});

describe("POST /tickets", () => {
  it("creates a ticket", async () => {
    const response = await request(app)
      .post("/tickets")
      .send({
        title: "Cannot log in",
        description: "Password reset failed"
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      id: 1,
      title: "Cannot log in",
      description: "Password reset failed",
      status: "open"
    });
  });

  it("gives each ticket a different id", async () => {
    const first = await request(app)
      .post("/tickets")
      .send({ title: "First", description: "One" });
    const second = await request(app)
      .post("/tickets")
      .send({ title: "Second", description: "Two" });

    expect(first.body.id).not.toBe(second.body.id);
  });

  it.each([
    ["missing title", { description: "Details" }],
    ["missing description", { title: "Title" }],
    ["whitespace-only title", { title: "   ", description: "Details" }],
    ["non-string title", { title: 123, description: "Details" }],
    ["no body", undefined]
  ])("rejects %s", async (_label, body) => {
    const response = await request(app).post("/tickets").send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "title and description are required"
    });
  });

  it("does not store a rejected ticket", async () => {
    await request(app).post("/tickets").send({ title: "Title" });

    const response = await request(app).get("/tickets");

    expect(response.body).toEqual([]);
  });
});

describe("GET /tickets", () => {
  it("returns an empty list when there are no tickets", async () => {
    const response = await request(app).get("/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns all created tickets", async () => {
    const first = await request(app)
      .post("/tickets")
      .send({ title: "First", description: "One" });
    const second = await request(app)
      .post("/tickets")
      .send({ title: "Second", description: "Two" });

    const response = await request(app).get("/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([first.body, second.body]);
  });
});

describe("GET /tickets/:id", () => {
  it("returns the ticket when it exists", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ title: "Cannot log in", description: "Password reset failed" });

    const response = await request(app).get(`/tickets/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(created.body);
  });

  it("returns 404 when the ticket does not exist", async () => {
    const response = await request(app).get("/tickets/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("returns 404 for a non-numeric id", async () => {
    const response = await request(app).get("/tickets/abc");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});

describe("PATCH /tickets/:id/status", () => {
  let ticket;

  beforeEach(async () => {
    const response = await request(app)
      .post("/tickets")
      .send({ title: "Cannot log in", description: "Password reset failed" });
    ticket = response.body;
  });

  it.each(["open", "in_progress", "closed"])(
    "updates a ticket to the %s status",
    async (status) => {
      const response = await request(app)
        .patch(`/tickets/${ticket.id}/status`)
        .send({ status });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...ticket, status });

      const storedTicket = await request(app).get(`/tickets/${ticket.id}`);
      expect(storedTicket.body.status).toBe(status);
    }
  );

  it.each([
    ["missing status", {}],
    ["non-string status", { status: 123 }],
    ["invalid status", { status: "pending" }],
    ["no request body", undefined]
  ])("rejects %s", async (_label, body) => {
    const response = await request(app)
      .patch(`/tickets/${ticket.id}/status`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid status" });
  });

  it.each(["999", "abc"])("returns 404 for unknown ticket id %s", async (id) => {
    const response = await request(app)
      .patch(`/tickets/${id}/status`)
      .send({ status: "closed" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("does not update the ticket or create history for an invalid status", async () => {
    await request(app)
      .patch(`/tickets/${ticket.id}/status`)
      .send({ status: "pending" });

    const ticketResponse = await request(app).get(`/tickets/${ticket.id}`);
    const historyResponse = await request(app).get(`/tickets/${ticket.id}/history`);

    expect(ticketResponse.body.status).toBe("open");
    expect(historyResponse.body).toEqual([]);
  });

  it("does not create history when the status is unchanged", async () => {
    const response = await request(app)
      .patch(`/tickets/${ticket.id}/status`)
      .send({ status: "open" });

    const historyResponse = await request(app)
      .get(`/tickets/${ticket.id}/history`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(ticket);
    expect(historyResponse.body).toEqual([]);
  });
});

describe("GET /tickets/:id/history", () => {
  it("returns an empty list when the ticket has no status changes", async () => {
    const ticket = await request(app)
      .post("/tickets")
      .send({ title: "Cannot log in", description: "Password reset failed" });

    const response = await request(app).get(`/tickets/${ticket.body.id}/history`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns status changes in chronological order", async () => {
    const ticket = await request(app)
      .post("/tickets")
      .send({ title: "Cannot log in", description: "Password reset failed" });

    await request(app)
      .patch(`/tickets/${ticket.body.id}/status`)
      .send({ status: "in_progress" });
    await request(app)
      .patch(`/tickets/${ticket.body.id}/status`)
      .send({ status: "closed" });

    const response = await request(app).get(`/tickets/${ticket.body.id}/history`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: 1,
      ticketId: ticket.body.id,
      from: "open",
      to: "in_progress"
    });
    expect(response.body[1]).toMatchObject({
      id: 2,
      ticketId: ticket.body.id,
      from: "in_progress",
      to: "closed"
    });

    for (const record of response.body) {
      expect(new Date(record.changedAt).toISOString()).toBe(record.changedAt);
    }
  });

  it("keeps each ticket's history separate while incrementing history ids", async () => {
    const firstTicket = await request(app)
      .post("/tickets")
      .send({ title: "First", description: "One" });
    const secondTicket = await request(app)
      .post("/tickets")
      .send({ title: "Second", description: "Two" });

    await request(app)
      .patch(`/tickets/${firstTicket.body.id}/status`)
      .send({ status: "in_progress" });
    await request(app)
      .patch(`/tickets/${secondTicket.body.id}/status`)
      .send({ status: "closed" });

    const firstHistory = await request(app)
      .get(`/tickets/${firstTicket.body.id}/history`);
    const secondHistory = await request(app)
      .get(`/tickets/${secondTicket.body.id}/history`);

    expect(firstHistory.body).toHaveLength(1);
    expect(firstHistory.body[0]).toMatchObject({
      id: 1,
      ticketId: firstTicket.body.id
    });
    expect(secondHistory.body).toHaveLength(1);
    expect(secondHistory.body[0]).toMatchObject({
      id: 2,
      ticketId: secondTicket.body.id
    });
  });

  it.each(["999", "abc"])("returns 404 for unknown ticket id %s", async (id) => {
    const response = await request(app).get(`/tickets/${id}/history`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});

describe("POST /tickets/:id/comments", () => {
  let ticket;

  beforeEach(async () => {
    const response = await request(app)
      .post("/tickets")
      .send({ title: "Cannot log in", description: "Password reset failed" });
    ticket = response.body;
  });

  it("creates a comment for a ticket", async () => {
    const response = await request(app)
      .post(`/tickets/${ticket.id}/comments`)
      .send({ body: "Customer confirmed the issue." });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      ticketId: ticket.id,
      body: "Customer confirmed the issue."
    });
  });

  it("gives each comment an incremental id", async () => {
    const first = await request(app)
      .post(`/tickets/${ticket.id}/comments`)
      .send({ body: "First comment" });
    const second = await request(app)
      .post(`/tickets/${ticket.id}/comments`)
      .send({ body: "Second comment" });

    expect(first.body.id).toBe(1);
    expect(second.body.id).toBe(2);
  });

  it.each([
    ["missing body", {}],
    ["non-string body", { body: 123 }],
    ["whitespace-only body", { body: "   " }],
    ["no request body", undefined]
  ])("rejects %s", async (_label, body) => {
    const response = await request(app)
      .post(`/tickets/${ticket.id}/comments`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "body is required" });
  });

  it("does not store a rejected comment or consume an id", async () => {
    await request(app)
      .post(`/tickets/${ticket.id}/comments`)
      .send({ body: "   " });

    const listResponse = await request(app)
      .get(`/tickets/${ticket.id}/comments`);
    const createResponse = await request(app)
      .post(`/tickets/${ticket.id}/comments`)
      .send({ body: "Valid comment" });

    expect(listResponse.body).toEqual([]);
    expect(createResponse.body.id).toBe(1);
  });

  it.each(["999", "abc"])("returns 404 for unknown ticket id %s", async (id) => {
    const response = await request(app)
      .post(`/tickets/${id}/comments`)
      .send({ body: "Comment" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});

describe("GET /tickets/:id/comments", () => {
  it("returns an empty list when the ticket has no comments", async () => {
    const ticket = await request(app)
      .post("/tickets")
      .send({ title: "Cannot log in", description: "Password reset failed" });

    const response = await request(app)
      .get(`/tickets/${ticket.body.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns only the ticket's comments in creation order", async () => {
    const firstTicket = await request(app)
      .post("/tickets")
      .send({ title: "First", description: "One" });
    const secondTicket = await request(app)
      .post("/tickets")
      .send({ title: "Second", description: "Two" });

    const firstComment = await request(app)
      .post(`/tickets/${firstTicket.body.id}/comments`)
      .send({ body: "First comment" });
    await request(app)
      .post(`/tickets/${secondTicket.body.id}/comments`)
      .send({ body: "Other ticket comment" });
    const secondComment = await request(app)
      .post(`/tickets/${firstTicket.body.id}/comments`)
      .send({ body: "Second comment" });

    const response = await request(app)
      .get(`/tickets/${firstTicket.body.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([firstComment.body, secondComment.body]);
  });

  it.each(["999", "abc"])("returns 404 for unknown ticket id %s", async (id) => {
    const response = await request(app).get(`/tickets/${id}/comments`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});

describe("POST /tickets/:id/analyze", () => {
  const fakeAnalysis = {
    summary: "Deterministic test summary",
    category: "test category",
    urgency: "low",
    suggestedAction: "Test action"
  };

  let fakeAnalyzer;

  beforeEach(() => {
    fakeAnalyzer = vi.fn(async (_ticket) => fakeAnalysis);
    app = createApp(fakeAnalyzer);
  });

  it("returns an analysis for an existing ticket", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({
        title: "Cannot log in",
        description: "Password reset failed"
      });

    const response = await request(app)
      .post(`/tickets/${created.body.id}/analyze`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(fakeAnalysis);
    expect(fakeAnalyzer).toHaveBeenCalledOnce();
    expect(fakeAnalyzer).toHaveBeenCalledWith(created.body);
  });

  it("returns 404 when the ticket does not exist", async () => {
    const response = await request(app).post("/tickets/999/analyze");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
    expect(fakeAnalyzer).not.toHaveBeenCalled();
  });

  it("returns a safe error when analysis fails", async () => {
    fakeAnalyzer.mockRejectedValue(new Error("Analyzer unavailable"));
    const created = await request(app)
      .post("/tickets")
      .send({
        title: "Cannot log in",
        description: "Password reset failed"
      });

    const response = await request(app)
      .post(`/tickets/${created.body.id}/analyze`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Ticket analysis failed" });
  });
});
