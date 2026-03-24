const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.put("/accept/:id", taskController.acceptTask);
router.put("/status/:id", taskController.updateStatus);

module.exports = router;