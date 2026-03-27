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
const requestRoutes = require("./routes/requestRoutes");

const express = require('express');
const cors = require('cors');

const app = express();

// ✅ VERY IMPORTANT (MUST HAVE)
app.use(express.json());

// ✅ CORS (MUST HAVE)
app.use(cors());

// ✅ ROUTES (MUST HAVE)
const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

// (optional other routes)
app.use('/api/tasks', require('./routes/taskRoutes'));

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});



// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", tasks);
app.use("/api/rentals", rentals);
app.use("/api/transactions", transactions);
app.use("/api/users", users);
app.use("/api/auth", authRoutes);
app.use('/api/requests', requestRoutes);

// Connect to MongoDB Atlas
mongoose
  .connect("mongodb+srv://unigearuser:unigearunigear@unigear.ot0ga0d.mongodb.net/unigear?appName=unigear", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


