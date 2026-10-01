import { createApp } from "./app.js";

const PORT = 3000;

createApp().listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
