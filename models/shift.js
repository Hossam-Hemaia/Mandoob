const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shiftSchema = new Schema({
  shiftHours: {
    type: Number,
    required: true,
  },
  startingHour: {
    type: Number,
    min: 0,
    max: 23,
    required: true,
  },
  startingMinute: {
    type: Number,
    min: 0,
    max: 59,
    required: true,
  },
  endingHour: {
    type: Number,
    min: 0,
    max: 23,
    required: true,
  },
  endingMinute: {
    type: Number,
    min: 0,
    max: 59,
    required: true,
  },
});

module.exports = mongoose.model("shift", shiftSchema);
