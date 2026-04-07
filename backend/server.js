const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Backend running 🚀");
});

// SOS API
app.post("/sos", (req, res) => {
    const { location, type, timestamp } = req.body;

    console.log("🚨 SOS RECEIVED");
    console.log("Type:", type);
    console.log("Location:", location);
    console.log("Time:", timestamp);

    res.json({
        status: "success",
        message: "SOS received successfully"
    });
});

// Start server
app.listen(5000, () => {
    console.log("🚀 Server running at http://localhost:5000");
});