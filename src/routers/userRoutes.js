const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const User = require("../model/user");
const Task = require("../model/task");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeMail, sendGoodByeMail } = require("../emails/accounts");

const uploads = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Accepted filetypes are 'jpg','jpeg' and 'png'"));
    }
    cb(undefined, true);
  }
});

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    sendWelcomeMail(user.email, user.name);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials({
      email: req.body.email,
      password: req.body.password
    });
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send({ Error: "Something went wrong" });
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.post(
  "/users/me/avatar",
  auth,
  uploads.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ Error: error.message });
  }
);

router.delete(
  "/users/me/avatar",
  auth,
  async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ Error: error.message });
  }
);

router.get("/users/:id/avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error("No avatar");
    }
    res.set("Content-type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send({ Error: e.message });
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "age", "email", "password"];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ Error: "Invalid Operation" });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send(e);
    }
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(400).send({ Error: e });
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = await User.deleteOne(req.user);

    if (!user) {
      res.status(404).send({ Error: "No User found" });
    }

    sendGoodByeMail(req.user.email, req.user.name);
    await Task.deleteMany({ owner: req.user._id });

    res.send(user);
  } catch (e) {
    res.status(400).send({ Error: e });
  }
});

module.exports = router;
