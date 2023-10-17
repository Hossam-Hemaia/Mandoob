const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const smsSchema = new Schema({
  messageId: {
    type: String,
    required: true,
  },
  code: {
    type: String,
  },
  expiryStamp: {
    type: Number,
  },
});

module.exports = mongoose.model("sms", smsSchema);
