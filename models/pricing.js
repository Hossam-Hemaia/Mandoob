const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pricingSchema = new Schema(
  {
    pricingCategory: {
      type: String,
      required: true,
    },
    pricePerKilometer: {
      type: Number,
      default: 0,
    },
    minimumPrice: {
      type: Number,
      default: 0,
    },
    fridgePrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("pricing", pricingSchema);
