const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Task = require("../model/task");
const User = require("../model/user");

router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// GET /tasks?completed=true
// GET /tasks?limit=2&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  try {
    const user = await User.findById(req.user._id);
    await user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.status(201).send(user.tasks);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    // const task = await Task.findById(req.params.id);
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send("task not found");
    }

    console.log(task);

    res.status(201).send(task);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidupdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidupdate) {
    return res.status(400).send({ Error: "Invalid Operation" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params._id,
      owner: req.user._id
    });
    if (!task) {
      return res.status(404).send({ Error: "Task not found" });
    }

    updates.forEach((update) => (task[update] = req.body[update]));

    await task.save();
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send({ Error: e });
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      res.status(404).send({ Error: "Task not found" });
    }
    res.send(task);
  } catch (e) {
    res.status(400).send({ Error: e });
  }
});

module.exports = router;
