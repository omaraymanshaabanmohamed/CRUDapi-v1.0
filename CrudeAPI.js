const express = require("express");
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Stage 5: Swagger UI setup to serve interactive API documentation
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Stage 2: Mock in-memory database of tasks
let tasks = [
    { id: 1, title: "Learn backend basics", done: true },
    { id: 2, title: "Implement GET endpoints", done: false },
    { id: 3, title: "Understand HTTP status codes", done: false }
];

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

// Stage 2: GET /tasks - Return all tasks
app.get("/tasks", (req, res) => {
    res.json(tasks);
});

// Stage 2: GET /tasks/:id - Return a single task by ID
app.get("/tasks/:id", (req, res) => {
    // req.params.id parses the ":id" from the URL as a string (e.g. "/tasks/2" -> "2")
    const taskId = parseInt(req.params.id);
    
    // Find the task in our array that matches this ID
    const task = tasks.find(t => t.id === taskId);
    
    // If no task is found, send a 404 (Not Found) status and an error message
    if (!task) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
    }
    
    // If found, return the task with the default 200 OK status
    res.json(task);
});

// Stage 3: POST /tasks - Create a new task
app.post("/tasks", (req, res) => {
    const { title } = req.body;
    
    // Validate input: if title is missing or not a non-empty string
    if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required and cannot be empty" });
    }
    
    // Find next free ID (find max ID and add 1, or start at 1 if list is empty)
    const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    
    // Create new task object
    const newTask = {
        id: nextId,
        title: title.trim(),
        done: false
    };
    
    // Add to our list
    tasks.push(newTask);
    
    // Return 201 Created with the new task
    res.status(201).json(newTask);
});

// Stage 4: PUT /tasks/:id - Update a task (title and/or done status)
app.put("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    const { title, done } = req.body;

    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
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

    // Perform updates
    if (title !== undefined) {
        task.title = title.trim();
    }
    if (done !== undefined) {
        task.done = done;
    }

    // Return the updated task
    res.json(task);
});

// Stage 4: DELETE /tasks/:id - Remove a task
app.delete("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    
    // Find index of the task
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
    }

    // Remove the task from the array
    tasks.splice(taskIndex, 1);

    // Return 204 No Content (success, empty body)
    res.status(204).send();
});

// Stage 0 requested port 3000
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});