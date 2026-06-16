const mongoose = require("mongoose");

const fileItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
});

const codeProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    language: {
      type: String,
      required: [true, "Language is required"],
    },
    sourceCode: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [fileItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CodeProject", codeProjectSchema);
