const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");

router.get("/", taskController.getTasks);
router.post("/", auth, taskController.createTask);
router.put("/accept/:id", auth, taskController.acceptTask);
router.put("/status/:id", auth, taskController.updateStatus);

module.exports = router;