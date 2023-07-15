const Client = require("../models/client");
const ZoneData = require("../models/zoneData");
const CourierLog = require("../models/courierLog");

exports.findClient = async (clientId) => {
  try {
    const client = await Client.findById(clientId);
    return client;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findCourier = async (areaId, needFridge) => {
  try {
    const couriers = await ZoneData.find({ areaId: areaId });
    let selectedCourier;
    for (let courier of couriers) {
      console.log(needFridge);
      let courierLog = await CourierLog.findOne({
        courierId: courier.courierId,
        courierActive: true,
        isBusy: false,
        hasFridge: needFridge,
        hasOrder: false,
      });
      if (courierLog) {
        selectedCourier = courierLog;
        break;
      }
    }
    return selectedCourier;
  } catch (err) {
    throw new Error(err);
  }
};
