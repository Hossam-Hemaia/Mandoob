const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const foodZoneSchema = new Schema(
  {
    zoneName: {
      type: String,
      required: true,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("foodzone", foodZoneSchema);
