const mongoose = require("mongoose");

const Schema = mongoose.Schema;

clientSchema = new Schema(
  {
    clientName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "client",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("client", clientSchema);
