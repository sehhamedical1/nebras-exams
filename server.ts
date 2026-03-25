import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("exam_system.db");

// Database Design
db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    questions TEXT NOT NULL,
    students INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    code TEXT NOT NULL,
    settings TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    testId TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    score INTEGER NOT NULL,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT NOT NULL,
    FOREIGN KEY(testId) REFERENCES tests(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/tests", (req, res) => {
    try {
      const tests = db.prepare("SELECT * FROM tests").all();
      const parsedTests = tests.map((t: any) => ({
        ...t,
        questions: JSON.parse(t.questions),
        settings: JSON.parse(t.settings)
      }));
      res.json(parsedTests);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", (req, res) => {
    try {
      const test = db.prepare("SELECT * FROM tests WHERE id = ?").get(req.params.id) as any;
      if (!test) return res.status(404).json({ error: "Test not found" });
      res.json({
        ...test,
        questions: JSON.parse(test.questions),
        settings: JSON.parse(test.settings)
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", (req, res) => {
    try {
      const { id, name, questions, students, date, status, code, settings } = req.body;
      const stmt = db.prepare("INSERT INTO tests (id, name, questions, students, date, status, code, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run(id, name, JSON.stringify(questions), students || 0, date, status, code, JSON.stringify(settings || {}));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/tests/:id", (req, res) => {
    try {
      const { name, questions, students, date, status, code, settings } = req.body;
      const stmt = db.prepare("UPDATE tests SET name = ?, questions = ?, students = ?, date = ?, status = ?, code = ?, settings = ? WHERE id = ?");
      stmt.run(name, JSON.stringify(questions), students, date, status, code, JSON.stringify(settings), req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tests/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM tests WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/reports", (req, res) => {
    try {
      const reports = db.prepare("SELECT * FROM reports").all();
      const parsedReports = reports.map((r: any) => ({
        ...r,
        details: JSON.parse(r.details)
      }));
      res.json(parsedReports);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", (req, res) => {
    try {
      const { id, testId, name, phone, score, time, date, status, details } = req.body;
      const stmt = db.prepare("INSERT INTO reports (id, testId, name, phone, score, time, date, status, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run(id, testId, name, phone, score, time, date, status, JSON.stringify(details));
      
      // Update student count
      db.prepare("UPDATE tests SET students = students + 1 WHERE id = ?").run(testId);
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/reports/:id", (req, res) => {
    try {
      const { name, phone, score, time, date, status, details } = req.body;
      const stmt = db.prepare("UPDATE reports SET name = ?, phone = ?, score = ?, time = ?, date = ?, status = ?, details = ? WHERE id = ?");
      stmt.run(name, phone, score, time, date, status, JSON.stringify(details), req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
