const mongoose = require("mongoose");

const rejectionSchema = new mongoose.Schema(
  {
    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courier",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    rejectionReason: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("rejection", rejectionSchema);
