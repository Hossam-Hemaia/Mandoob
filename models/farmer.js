const mongoose = require("mongoose");
const userSchema = require("../models/users");

const Schema = mongoose.Schema;

const farmerSchema = new Schema(
  {
    farmId: {
      type: Schema.Types.ObjectId,
      ref: "farm",
    },
  },
  { timestamps: true }
);

const Farmer = userSchema.discriminator("farmer", farmerSchema);

module.exports = Farmer;
