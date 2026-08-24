const express = require("express");
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Stage 5: Swagger UI setup to serve interactive API documentation
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Stage 0: Initialize SQLite database
const Database = require("better-sqlite3");
const db = new Database("tasks.db");

// Create 'tasks' table if it doesn't exist yet
db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0
    )
`).run();

// Seed initial tasks ONLY if the database is empty
const rowCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
if (rowCount === 0) {
    const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    
    // Using a transaction ensures all insertions succeed, or none do (safe practice)
    const insertMany = db.transaction((tasksToSeed) => {
        for (const task of tasksToSeed) {
            insert.run(task.title, task.done);
        }
    });

    insertMany([
        { title: "Learn backend basics", done: 1 }, // 1 means true
        { title: "Implement GET endpoints", done: 0 }, // 0 means false
        { title: "Understand HTTP status codes", done: 0 }
    ]);
    console.log("Database initialized and seeded with 3 example tasks!");
}


// Stage 1: Root route returning JSON info about the API
app.get("/", (req, res) => {
    res.json({
        name: "Task API",
        version: "1.0",
        endpoints: ["/tasks"]
    });
});

// Stage 1: Health check route
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Stage 1: GET /tasks - Return all tasks from the database
app.get("/tasks", (req, res) => {
    // Run SELECT query to get all tasks
    const rows = db.prepare("SELECT * FROM tasks").all();
    
    // Map the database done status (0/1) back to booleans (false/true)
    const mappedTasks = rows.map(r => ({
        id: r.id,
        title: r.title,
        done: r.done === 1
    }));
    
    res.json(mappedTasks);
});

// Stage 1: GET /tasks/:id - Return a single task by ID from database
app.get("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    
    // Run a query using '?' placeholder for safety (prevents SQL injection)
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    
    // If no row is returned, send a 404
    if (!row) {
        return res.status(404).json({ error: "Task not found" });
    }
    
    // Send task details back with done status as a boolean
    res.json({
        id: row.id,
        title: row.title,
        done: row.done === 1
    });
});

// Stage 2: POST /tasks - Create a new task in the database
app.post("/tasks", (req, res) => {
    const { title } = req.body;
    
    // Validate input (client never trusted)
    if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required and cannot be empty" });
    }
    
    // Run INSERT query. 'done' is set to 0 (false) initially.
    const info = db.prepare("INSERT INTO tasks (title, done) VALUES (?, 0)").run(title.trim());
    
    // Return 201 Created with the new task details (info.lastInsertRowid gives the auto-generated ID)
    res.status(201).json({
        id: Number(info.lastInsertRowid),
        title: title.trim(),
        done: false
    });
});

// Stage 3: PUT /tasks/:id - Update a task (title and/or done status) in database
app.put("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    const { title, done } = req.body;

    // Check if task exists first
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }

    // Validate body: Must send at least one field to update
    if (title === undefined && done === undefined) {
        return res.status(400).json({ error: "At least one of 'title' or 'done' must be provided to update" });
    }

    // Validate title if provided
    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
        return res.status(400).json({ error: "Title must be a non-empty string" });
    }

    // Validate done status if provided
    if (done !== undefined && typeof done !== "boolean") {
        return res.status(400).json({ error: "Done must be a boolean (true or false)" });
    }

    // Use existing data if update values are not provided
    const newTitle = title !== undefined ? title.trim() : task.title;
    const newDone = done !== undefined ? (done ? 1 : 0) : task.done;

    // Execute the UPDATE query
    db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, taskId);

    // Return the updated task
    res.json({
        id: taskId,
        title: newTitle,
        done: newDone === 1
    });
});

// Stage 3: DELETE /tasks/:id - Remove a task from the database
app.delete("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    
    // Execute DELETE query
    const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    
    // If changes === 0, it means no rows were matched/deleted
    if (info.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
    }

    // Return 204 No Content (success, empty body)
    res.status(204).send();
});

// Stage 0 requested port 3000
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});