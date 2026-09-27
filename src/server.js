import express from "express";

const app = express();

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


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
