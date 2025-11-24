const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const {
  validateURL,
  validateCode,
  generateCode,
} = require("../middleware/validation");

// POST /api/links - Create link
router.post("/", async (req, res) => {
  try {
    const { target_url, custom_code } = req.body;

    // Validate URL
    if (!target_url || !validateURL(target_url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    let code = custom_code;

    if (code) {
      // Validate custom code
      if (!validateCode(code)) {
        return res.status(400).json({
          error: "Code must be 6-8 alphanumeric characters",
        });
      }
    } else {
      // Generate random code
      code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await pool.query(
          "SELECT id FROM links WHERE code = $1",
          [code]
        );
        if (existing.rows.length === 0) break;
        code = generateCode();
        attempts++;
      }
    }

    // Insert into database
    const result = await pool.query(
      "INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *",
      [code, target_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation
      return res.status(409).json({ error: "Code already exists" });
    }
    console.error("Create link error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/links - List all links
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM links ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get links error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/links/:code - Get stats for one code
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query("SELECT * FROM links WHERE code = $1", [
      code,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get link error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/links/:code - Delete link
router.delete("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      "DELETE FROM links WHERE code = $1 RETURNING *",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json({ message: "Link deleted", code });
  } catch (err) {
    console.error("Delete link error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
