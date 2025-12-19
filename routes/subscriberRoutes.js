const express = require("express");
const Subscriber = require("../models/Subscriber");

const router = express.Router();

// Get all subscribers
router.get("/", async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
});

// Add a new subscriber
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(200).json(existing);
    }

    const subscriber = await Subscriber.create({ email });
    res.status(201).json(subscriber);
  } catch (error) {
    console.error("SUBSCRIBER ERROR:", error.message);
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

module.exports = router;
