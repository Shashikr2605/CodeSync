// Express app factory — middleware and routes only
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
