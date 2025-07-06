import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

// PostgreSQL config
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.post("/api/tasks", async (req, res) => {
  const { user_id, text, description, status, priority, due_date } = req.body;

  if (!user_id || !text) {
    return res.status(400).json({ error: "user_id and text are required" });
  }

  try {
    const id = uuidv4();
    const query = `
      INSERT INTO tasksa (id, user_id, text, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      id,
      user_id,
      text,
      description,
      status || 'todo',
      priority,
      due_date || null,
    ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error inserting task:", err);
    res.status(500).json({ error: "Failed to insert task" });
  }
});

app.get("/api/tasks/status/:status", async (req, res) => {
  const { status } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  try {
    const query = `
      SELECT * FROM tasksa
      WHERE user_id = $1 AND status = $2
      ORDER BY created_at DESC;
    `;
    const values = [user_id, status];

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching tasks by status:", err);
    res.status(500).json({ error: "Failed to fetch tasks by status" });
  }
});

app.get("/api/tasks", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  console.log("➡️ Fetching tasks for user_id:", user_id);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM tasksa WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/manual-login", async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }

  try {
    let result = await pool.query(
      `INSERT INTO users (username, email) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO NOTHING 
       RETURNING uid, username, email, created_at`,
      [username, email]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT uid, username, email, created_at FROM users WHERE email = $1`,
        [email]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Missing status in request body" });
  }

  try {
    const result = await pool.query(
      `UPDATE tasksa SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating task status:", err);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// Only run locally, not in Lambda
if (process.env.NODE_ENV !== 'production') {
  app.listen(5000, () => {
    console.log("✅ Server running at http://localhost:5000");
  });
}

export default app;
