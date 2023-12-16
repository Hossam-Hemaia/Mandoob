const mongoose = require("mongoose");
const userSchema = require("../models/users");

const Schema = mongoose.Schema;

const supervisorSchema = new Schema(
  {
    couriersIds: [{ type: Schema.Types.ObjectId, ref: "courier" }],
  },
  { timestamps: true }
);

const Supervisor = userSchema.discriminator("supervisor", supervisorSchema);

module.exports = Supervisor;
