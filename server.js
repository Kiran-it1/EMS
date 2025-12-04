const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || "1d";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve canonical static asset folders
app.use(express.static(path.join(__dirname, "pages")));
app.use(express.static(path.join(__dirname, "scripts")));
app.use(express.static(path.join(__dirname, "styles")));

// Database initialization
const db = new sqlite3.Database("./events.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Events table
  db.run(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      event_name TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue TEXT,
      max_participants INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating events table:", err.message);
    }
  );

  // Registrations table
  db.run(
    `CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(event_id)
    )`,
    (err) => {
      if (err) console.error("Error creating registrations table:", err.message);
    }
  );

  // Users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating users table:", err.message);
    }
  );
}

// ----------------- Auth Helpers -----------------

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Invalid authorization header" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin privileges required" });
  next();
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_SPECIAL_REGEX.test(password)
  );
}

// ----------------- Check Overlap -----------------

function checkTimeOverlap(newStartDate, newEndDate, newStartTime, newEndTime, excludeEventId = null) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM events`;
    const params = [];

    if (excludeEventId) {
      query += ` WHERE event_id != ?`;
      params.push(excludeEventId);
    }

    db.all(query, params, (err, existingEvents) => {
      if (err) return reject(err);

      const newStart = new Date(newStartDate + "T" + newStartTime);
      const newEnd = new Date(newEndDate + "T" + newEndTime);

      for (const event of existingEvents) {
        const existingStart = new Date(event.start_date + "T" + event.start_time);
        const existingEnd = new Date(event.end_date + "T" + event.end_time);

        if (newStart < existingEnd && newEnd > existingStart) {
          return resolve(true);
        }
      }

      resolve(false);
    });
  });
}

// ----------------- AUTH ROUTES -----------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ error: "Email, password, and role are required" });

    const normalizedRole = role === "participant" ? "user" : role;

    if (!["user", "admin"].includes(normalizedRole))
      return res.status(400).json({ error: "Role must be user or admin" });

    if (!isStrongPassword(password))
      return res.status(400).json({
        error: "Password must be at least 8 characters and include one special character",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
      [email.toLowerCase(), hashedPassword, normalizedRole],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE"))
            return res.status(400).json({ error: "Email already registered" });
          return res.status(500).json({ error: err.message });
        }

        res.json({ message: "Registration successful" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  db.get("SELECT * FROM users WHERE email = ?", [email.toLowerCase()], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  });
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ----------------- EVENT ROUTES -----------------

// Get all events
app.get("/api/events", (req, res) => {
  db.all("SELECT * FROM events ORDER BY start_date, start_time", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single event
app.get("/api/events/:eventId", (req, res) => {
  db.get(
    "SELECT * FROM events WHERE event_id = ?",
    [req.params.eventId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Event not found" });
      res.json(row);
    }
  );
});

// Create new event
app.post("/api/events", authenticateToken, requireAdmin, async (req, res) => {
  const {
    event_id,
    event_name,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    venue,
    max_participants,
  } = req.body;

  if (!event_id || !event_name || !start_date || !end_date || !start_time || !end_time)
    return res.status(400).json({ error: "Missing required fields" });

  const start = new Date(start_date + "T" + start_time);
  const end = new Date(end_date + "T" + end_time);

  if (start >= end)
    return res.status(400).json({ error: "Start date/time must be before end date/time" });

  try {
    const overlap = await checkTimeOverlap(start_date, end_date, start_time, end_time);

    if (overlap)
      return res.status(400).json({ error: "Event time overlaps with existing event" });

    db.run(
      `INSERT INTO events (event_id, event_name, description, start_date, end_date, start_time, end_time, venue, max_participants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id,
        event_name,
        description,
        start_date,
        end_date,
        start_time,
        end_time,
        venue,
        max_participants,
      ],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE"))
            return res.status(400).json({ error: "Event ID already exists" });

          return res.status(500).json({ error: err.message });
        }

        res.json({ id: this.lastID, message: "Event created successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- UPDATE EVENT -----------------

app.put("/api/events/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  const eventId = req.params.eventId;
  const {
    event_name,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    venue,
    max_participants,
  } = req.body;

  const start = new Date(start_date + "T" + start_time);
  const end = new Date(end_date + "T" + end_time);

  if (start >= end)
    return res.status(400).json({ error: "Start date/time must be before end date/time" });

  try {
    const overlap = await checkTimeOverlap(start_date, end_date, start_time, end_time, eventId);

    if (overlap)
      return res.status(400).json({ error: "Event time overlaps with existing event" });

    db.run(
      `UPDATE events 
       SET event_name = ?, description = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ?, venue = ?, max_participants = ? 
       WHERE event_id = ?`,
      [
        event_name,
        description,
        start_date,
        end_date,
        start_time,
        end_time,
        venue,
        max_participants,
        eventId,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Event not found" });

        res.json({ message: "Event updated successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- DELETE EVENT -----------------

app.delete("/api/events/:eventId", authenticateToken, requireAdmin, (req, res) => {
  db.run(
    "DELETE FROM events WHERE event_id = ?",
    [req.params.eventId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Event not found" });

      res.json({ message: "Event deleted successfully" });
    }
  );
});

// ----------------- USER REGISTRATION ROUTE -----------------

app.post("/api/events/:eventId/register", authenticateToken, (req, res) => {
  const eventId = req.params.eventId;
  const { user_name, user_phone } = req.body;

  if (!user_name)
    return res.status(400).json({ error: "Name is required" });

  if (req.user.role !== "user")
    return res.status(403).json({ error: "Only users can register for events" });

  db.get("SELECT * FROM events WHERE event_id = ?", [eventId], (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!event) return res.status(404).json({ error: "Event not found" });

    db.get(
      "SELECT * FROM registrations WHERE event_id = ? AND user_email = ?",
      [eventId, req.user.email],
      (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing)
          return res.status(400).json({ error: "You are already registered for this event" });

        if (event.max_participants) {
          db.get(
            "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?",
            [eventId],
            (err, result) => {
              if (err) return res.status(500).json({ error: err.message });

              if (result.count >= event.max_participants)
                return res.status(400).json({ error: "Event is full" });

              db.run(
                "INSERT INTO registrations (event_id, user_name, user_email, user_phone) VALUES (?, ?, ?, ?)",
                [eventId, user_name, req.user.email, user_phone],
                function (err) {
                  if (err) return res.status(500).json({ error: err.message });
                  res.json({ id: this.lastID, message: "Registration successful" });
                }
              );
            }
          );
        } else {
          db.run(
            "INSERT INTO registrations (event_id, user_name, user_email, user_phone) VALUES (?, ?, ?, ?)",
            [eventId, user_name, req.user.email, user_phone],
            function (err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ id: this.lastID, message: "Registration successful" });
            }
          );
        }
      }
    );
  });
});

// ----------------- REGISTRATION VIEWS -----------------

app.get(
  "/api/events/:eventId/registrations",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.all(
      "SELECT * FROM registrations WHERE event_id = ? ORDER BY registration_date DESC",
      [req.params.eventId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  }
);

app.get("/api/events/:eventId/registrations/count", (req, res) => {
  db.get(
    "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?",
    [req.params.eventId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: row.count });
    }
  );
});

// ----------------- SERVE FRONTEND -----------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "public", "index.html"));
});

// Fallback to SPA for unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "public", "index.html"));
});

// ----------------- START SERVER -----------------

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// ----------------- GRACEFUL SHUTDOWN -----------------

process.on("SIGINT", () => {
  db.close((err) => {
    if (err) console.error("Error closing database:", err.message);
    else console.log("Database connection closed");
    process.exit(0);
  });
});