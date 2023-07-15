const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const areaSchema = new Schema({
  zoneName: {
    type: String,
    required: true,
  },
  areaName: {
    type: String,
  },
  areaPolygon: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

module.exports = mongoose.model("area", areaSchema);
