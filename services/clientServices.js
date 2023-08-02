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

exports.findClientByPhoneNumber = async (phoneNumber) => {
  try {
    const client = await Client.findOne({ phoneNumber });
    if (!client) {
      throw new Error("Phone number is not registered!");
    }
    return client;
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateClient = async (phoneNumber, clientData) => {
  try {
    const updatedClient = await Client.updateOne(
      { phoneNumber: phoneNumber },
      clientData
    );
    if (updatedClient) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.findCourier = async (areaId, needFridge) => {
  try {
    const couriers = await ZoneData.find({ areaId: areaId });
    let selectedCourier;
    for (let courier of couriers) {
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

// Delete Client Account
exports.deleteClientAccount = async (clientId) => {
  try {
    await Client.findByIdAndDelete(clientId);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};
