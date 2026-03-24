const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const taskRoutes = require("./routes/taskRoutes");
const tasks = require("./routes/tasks");
const rentals = require("./routes/rentals");
const transactions = require("./routes/transactions");
const users = require("./routes/users");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", tasks); // More complete task operations
app.use("/api/rentals", rentals);
app.use("/api/transactions", transactions);
app.use("/api/users", users);
app.use("/api/auth", authRoutes);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/unigear", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));