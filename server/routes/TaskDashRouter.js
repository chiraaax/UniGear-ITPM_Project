const express = require('express');
const router = express.Router();

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// GET (with filters)
router.get('/', getTasks);

// CREATE
router.post('/', createTask);

// UPDATE
router.put('/:id', updateTask);

// DELETE
router.delete('/:id', deleteTask);

module.exports = router;