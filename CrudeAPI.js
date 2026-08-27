const express = require("express");
const path = require("path");
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Stage 5: Swagger UI setup to serve interactive API documentation
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Stage 0 & 3: Load repository layer
const SqliteTaskRepository = require("./repositories/SqliteTaskRepository");
const taskRepo = new SqliteTaskRepository();


// Stage 1: Root route returning landing page HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Stage 1: Health check route
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Stage 1: GET /tasks - Return all tasks from the repository
app.get("/tasks", async (req, res) => {
    const mappedTasks = await taskRepo.getAll();
    res.json(mappedTasks);
});

// Stage 1: GET /tasks/:id - Return a single task by ID from the repository
app.get("/tasks/:id", async (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = await taskRepo.getById(taskId);
    
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    
    res.json(task);
});

// Stage 2: POST /tasks - Create a new task in the repository
app.post("/tasks", async (req, res) => {
    const { title } = req.body;
    
    // Validate input (client never trusted)
    if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required and cannot be empty" });
    }
    
    const newTask = await taskRepo.create(title);
    res.status(201).json(newTask);
});

// Stage 3: PUT /tasks/:id - Update a task (title and/or done status) in the repository
app.put("/tasks/:id", async (req, res) => {
    const taskId = parseInt(req.params.id);
    const { title, done } = req.body;

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

    const updatedTask = await taskRepo.update(taskId, { title, done });
    if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
});

// Stage 3: DELETE /tasks/:id - Remove a task from the repository
app.delete("/tasks/:id", async (req, res) => {
    const taskId = parseInt(req.params.id);
    const success = await taskRepo.delete(taskId);
    
    if (!success) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.status(204).send();
});

// Stage 0 requested port 3000
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});