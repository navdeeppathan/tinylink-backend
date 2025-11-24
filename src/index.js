const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { pool, initDB } = require("./db");
const linksRouter = require("./routes/links");

const app = express();
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/healthz", (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    ok: true,
    version: "1.0",
    uptime: uptime,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/links", linksRouter);

// Redirect route - must be last to avoid conflicts
app.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // Skip if it's an API route or healthz
    if (code === "api" || code === "healthz" || code === "code") {
      return res.status(404).send("Not found");
    }

    // Update click count and redirect
    const result = await pool.query(
      `UPDATE links 
       SET total_clicks = total_clicks + 1, 
           last_clicked = CURRENT_TIMESTAMP 
       WHERE code = $1 
       RETURNING target_url`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Link not found");
    }

    res.redirect(302, result.rows[0].target_url);
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).send("Server error");
  }
});

// Initialize database and start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/healthz`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
