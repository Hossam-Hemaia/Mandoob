const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const farmSchema = new Schema(
  {
    farmName: {
      type: String,
      required: true,
    },
    foodZoneId: {
      type: Schema.Types.ObjectId,
      ref: "foodzone",
    },
    category: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("farm", farmSchema);
