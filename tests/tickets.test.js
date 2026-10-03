import { beforeEach, describe, expect, it } from "vitest";
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

describe("POST /tickets/:id/analyze", () => {
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
    expect(response.body).toEqual({
      summary: "Cannot log in: Password reset failed",
      category: "account access",
      urgency: "medium",
      suggestedAction: "Verify the account and help the requester restore access."
    });
  });

  it("returns 404 when the ticket does not exist", async () => {
    const response = await request(app).post("/tickets/999/analyze");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});
