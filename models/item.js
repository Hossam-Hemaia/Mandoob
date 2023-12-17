const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    itemName: {
      type: String,
    },
    pricingSystem: {
      type: String,
    },
    itemPrice: {
      type: Number,
    },
    itemImage: {
      type: String,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: "farm",
    },
    itemBlocked: {
      type: Boolean,
      default: false,
    },
    sizes: [{ type: String }],
    colors: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("item", itemSchema);
