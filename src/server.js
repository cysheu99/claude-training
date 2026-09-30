import express from "express";

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


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
