import express from "express";
import { analyzeTicket } from "./claude.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  const tickets = [];
  let nextId = 1;

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
    const { title, description } = req.body ?? {};

    if (typeof title !== "string" || title.trim() === "" ||
        typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        error: "title and description are required"
      });
    }

    const ticket = {
      id: nextId++,
      title,
      description,
      status: "open"
    };

    tickets.push(ticket);
    res.status(201).json(ticket);
  });

  app.get("/tickets", (req, res) => {
    res.json(tickets);
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

  app.post("/tickets/:id/analyze", async (req, res) => {
    const id = Number(req.params.id);
    const ticket = tickets.find((ticket) => ticket.id === id);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    const analysis = await analyzeTicket(ticket);
    res.json(analysis);
  });

  return app;
}
