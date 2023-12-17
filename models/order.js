const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    fromAddress: {
      type: String,
      required: true,
    },
    toAddress: {
      type: String,
      required: true,
    },
    fromPoint: {
      lat: { type: Number },
      lng: { type: Number },
    },
    toPoint: {
      lat: { type: Number },
      lng: { type: Number },
    },
    parcelImage: {
      type: String,
    },
    attachments: [],
    parcelName: {
      type: String,
    },
    parcelType: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderPhone: {
      type: String,
    },
    receiverName: {
      type: String,
      required: true,
    },
    receiverPhone: {
      type: String,
      default: "",
    },
    deliveryPrice: {
      type: Number,
      default: 0,
    },
    payer: {
      type: String,
      default: "",
    },
    paymentStatus: {
      //paid or pending
      type: String,
      default: "",
    },
    paymentType: {
      //cash or credit
      type: String,
      default: "",
    },
    orderStatus: [{ state: { type: String }, date: { type: Date } }], //[pending, accepted, received, transporting, delivered or rejected]
    serviceType: {
      type: String,
      required: true,
    },
    orderType: { type: String }, // instant delivery or dated delivery
    orderDate: {
      type: Date,
      default: new Date(),
    },
    orderTime: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      default: "",
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: true,
    },
    orderItems: [
      {
        farmName: { type: String },
        itemId: { type: Schema.Types.ObjectId, ref: "item" },
        itemName: { type: String },
        itemPrice: { type: Number },
        quantity: { type: Number },
        itemUnit: { type: String },
        size: { type: String, default: "" },
        color: { type: String, default: "" },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    courierId: {
      type: Schema.Types.ObjectId,
      ref: "courier",
    },
  },
  { timestamps: true, strictPopulate: false }
);

module.exports = mongoose.model("order", orderSchema);
