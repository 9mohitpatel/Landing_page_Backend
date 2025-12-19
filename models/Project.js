const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
