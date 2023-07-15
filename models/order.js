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
    attachments: [
      {
        type: String,
      },
    ],
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
    },
    deliveryPrice: {
      type: Number,
    },
    payer: {
      type: String,
    },
    paymentStatus: {
      //paid or pending
      type: String,
    },
    paymentType: {
      //cash or credit
      type: String,
    },
    orderStatus: [{ state: { type: String }, date: { type: Date } }], //[pending, received, transporting, delivered or rejected]
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
    },
    companyName: {
      type: String,
    },
    businessType: {
      type: String,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: true,
    },
    orderItems: [
      {
        itemName: { type: String },
        itemPrice: { type: Number },
        quantity: { type: Number },
      },
    ],
    notes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    courierId: {
      type: Schema.Types.ObjectId,
      ref: "courier",
    },
  },
  { timestamps: true, strictPopulate: false }
);

module.exports = mongoose.model("order", orderSchema);
