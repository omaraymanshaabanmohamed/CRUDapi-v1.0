const express = require("express");
const app = express();

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

// Stage 0 requested port 3000
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});