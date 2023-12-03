const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const suggestionSchema = new Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("suggestion", suggestionSchema);
