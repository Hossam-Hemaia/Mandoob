const mongoose = require("mongoose");
const shift = require("./shift");

const Schema = mongoose.Schema;

const shiftTimeoutSchema = new Schema({
  courierId: {
    type: Schema.Types.ObjectId,
    ref: "courier",
    required: true,
  },
  timeoutId: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Number,
  },
  numberOfHours: {
    type: Number,
  },
});

module.exports = mongoose.model("shiftTimeout", shiftTimeoutSchema);
