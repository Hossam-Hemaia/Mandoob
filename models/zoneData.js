const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const zoneSchema = new Schema(
  {
    zoneName: {
      type: String,
    },
    areaId: {
      type: Schema.Types.ObjectId,
      ref: "area",
    },
    courierId: {
      type: Schema.Types.ObjectId,
      ref: "courier",
    },
    username: {
      type: Number,
    },
    courierName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("zoneData", zoneSchema);
