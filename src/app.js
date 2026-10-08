import express from "express";
import { analyzeTicket } from "./claude.js";

export function createApp(analyzer = analyzeTicket) {
  const app = express();

  app.use(express.json());

  const tickets = [];
  let nextId = 1;
  const comments = [];
  let nextCommentId = 1;
  const statusHistory = [];
  let nextHistoryId = 1;
  const allowedSeverities = ["low", "medium", "high", "critical"];

  app.get("/", (req, res) => {
    res.json({
      message: "Hello from my first API"
    });
  });

  app.get("/health", (req, res) => {
    res.json({
      status: "ok"
    });
  });

  app.get("/info", (req, res) => {
    res.json({
      project: "claude-training",
      runtime: "node"
    });
  });

  app.post("/tickets", (req, res) => {
    const { title, description, severity = "medium" } = req.body ?? {};

    if (typeof title !== "string" || title.trim() === "" ||
        typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        error: "title and description are required"
      });
    }

    if (!allowedSeverities.includes(severity)) {
      return res.status(400).json({
        error: "Invalid severity"
      });
    }

    const ticket = {
      id: nextId++,
      title,
      description,
      status: "open",
      severity
    };

    tickets.push(ticket);
    res.status(201).json(ticket);
  });

  app.get("/tickets", (req, res) => {
    const { severity } = req.query;

    if (severity === undefined) {
      return res.json(tickets);
    }

    if (!allowedSeverities.includes(severity)) {
      return res.status(400).json({
        error: "Invalid severity"
      });
    }

    res.json(tickets.filter((ticket) => ticket.severity === severity));
  });

  app.get("/tickets/:id", (req, res) => {
    const id = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === id);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    res.json(ticket);
  });

  app.patch("/tickets/:id/status", (req, res) => {
    const ticketId = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    const { status } = req.body ?? {};
    const allowedStatuses = ["open", "in_progress", "closed"];

    if (typeof status !== "string" || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status"
      });
    }

    if (ticket.status === status) {
      return res.json(ticket);
    }

    const previousStatus = ticket.status;
    ticket.status = status;
    statusHistory.push({
      id: nextHistoryId++,
      ticketId,
      from: previousStatus,
      to: status,
      changedAt: new Date().toISOString()
    });

    res.json(ticket);
  });

  app.get("/tickets/:id/history", (req, res) => {
    const ticketId = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    res.json(statusHistory.filter((record) => record.ticketId === ticketId));
  });

  app.post("/tickets/:id/comments", (req, res) => {
    const ticketId = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    const { body } = req.body ?? {};

    if (typeof body !== "string" || body.trim() === "") {
      return res.status(400).json({
        error: "body is required"
      });
    }

    const comment = {
      id: nextCommentId++,
      ticketId,
      body
    };

    comments.push(comment);
    res.status(201).json(comment);
  });

  app.get("/tickets/:id/comments", (req, res) => {
    const ticketId = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    res.json(comments.filter((comment) => comment.ticketId === ticketId));
  });

  app.post("/tickets/:id/analyze", async (req, res) => {
    const id = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === id);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    try {
      const analysis = await analyzer(ticket);
      res.json(analysis);
    } catch (_error) {
      res.status(500).json({
        error: "Ticket analysis failed"
      });
    }
  });

  return app;
}
