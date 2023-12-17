const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const foodZoneSchema = new Schema(
  {
    zoneName: {
      type: String,
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    zonePrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("foodzone", foodZoneSchema);
