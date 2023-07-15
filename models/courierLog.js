const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const courierLogSchema = new Schema(
  {
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
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    hasFridge: {
      type: Boolean,
    },
    hasOrder: {
      type: Boolean,
      default: false,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
    openDate: {
      type: Date,
    },
    closeDate: {
      type: Date,
    },
    courierActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("courierLog", courierLogSchema);
