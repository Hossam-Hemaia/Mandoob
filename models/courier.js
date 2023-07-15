const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const courierSchema = new Schema(
  {
    courierName: {
      type: String,
      required: true,
    },
    birthdate: {
      type: Date,
    },
    phoneNumber: {
      type: String,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
    },
    carBrand: {
      type: String,
    },
    carModel: {
      type: String,
    },
    plateNumber: {
      type: String,
    },
    documents: [{ type: String }],
    workingAreaId: {
      type: Schema.Types.ObjectId,
      ref: "area",
      required: true,
    },
    workingShiftId: {
      type: Schema.Types.ObjectId,
      ref: "shift",
      required: true,
    },
    hasFridge: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    username: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "courier",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("courier", courierSchema);
