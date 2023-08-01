const Courier = require("../models/courier");
const CourierLog = require("../models/courierLog");
const ZoneData = require("../models/zoneData");
const Rejection = require("../models/rejection");
const Shift = require("../models/shift");
const ShiftTimeout = require("../models/shiftTimeout");
const Order = require("../models/order");
const orderServices = require("../services/orderServices");
const utilities = require("../utils/utilities");

exports.findAllCouriers = async () => {
  try {
    const couriers = await Courier.find().populate([
      "workingAreaId",
      "workingShiftId",
      "courierLogId",
    ]);
    return couriers;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findCourier = async (courierId) => {
  try {
    const courier = await Courier.findById(courierId);
    return courier;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getCourierData = async (courierId) => {
  try {
    const courier = await Courier.findById(courierId).populate("workingAreaId");
    return courier;
  } catch (err) {
    throw new Error(err);
  }
};

exports.editCourier = async (courierData) => {
  try {
    console.log(courierData);
    const courier = await this.findCourier(courierData.courierId);
    courier.courierName =
      courierData.courierName !== ""
        ? courierData.courierName
        : courier.courierName;
    courier.birthdate =
      courierData.birthdate !== "" ? courierData.birthdate : courier.birthdate;
    courier.phoneNumber =
      courierData.phoneNumber !== ""
        ? courierData.phoneNumber
        : courier.phoneNumber;
    courier.licenseNumber =
      courierData.licenseNumber !== ""
        ? courierData.licenseNumber
        : courier.licenseNumber;
    courier.companyName =
      courierData.companyName !== ""
        ? courierData.companyName
        : courier.companyName;
    courier.carBrand =
      courierData.carBrand !== "" ? courierData.carBrand : courier.carBrand;
    courier.carModel =
      courierData.carModel !== "" ? courierData.carModel : courier.carModel;
    courier.plateNumber =
      courierData.plateNumber !== ""
        ? courierData.plateNumber
        : courier.plateNumber;
    courier.documents =
      courierData.documents.length > 0
        ? courierData.documents
        : courier.documents;
    courier.workingAreaId =
      courierData.workingAreaId !== ""
        ? courierData.workingAreaId
        : courier.workingAreaId;
    courier.workingShiftId =
      courierData.workingShiftId !== ""
        ? courierData.workingShiftId
        : courier.workingShiftId;
    courier.password =
      courierData.password !== "" ? courierData.password : courier.password;
    await courier.save();
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

exports.removeCourier = async (courierId) => {
  try {
    await Courier.findByIdAndDelete(courierId);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

exports.assignCourier = async (courierId) => {
  try {
    const courierLog = await CourierLog.findOne({ courierId: courierId });
    courierLog.hasOrder = true;
    courierLog.isBusy = false;
    await courierLog.save();
    return courierLog;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findCourierLog = async (courierId) => {
  try {
    const courierLog = await CourierLog.findOne({ courierId: courierId });
    if (!courierLog) {
      return { hasLog: false };
    } else {
      return { hasLog: true, courierLog };
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.createCourierLog = async (courierData) => {
  try {
    const courierLog = new CourierLog(courierData);
    await courierLog.save();
    const courier = await this.findCourier(courierData.courierId);
    courier.courierLogId = courierLog._id;
    await courier.save();
    return courierLog;
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateCourierLog = async (courierData) => {
  try {
    const filter = { courierId: courierData.courierId };
    const updateData = {};
    for (let key in courierData) {
      if (courierData[key] !== "" && key !== "courierId") {
        updateData[key] = courierData[key];
      }
    }
    await CourierLog.updateOne(filter, updateData);
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateCourierLocation = async (courierData) => {
  try {
    const filter = { courierId: courierData.courier._id };
    const updateData = {
      location: courierData.location,
    };
    await CourierLog.updateOne(filter, updateData);
  } catch (err) {
    throw new Error(err);
  }
};

exports.createCourierTurn = async (courierData) => {
  try {
    const courierTurn = new ZoneData(courierData);
    await courierTurn.save();
    return courierTurn;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findCourierTurn = async (username) => {
  try {
    const courierTurn = await ZoneData.findOne({ username: username });
    return courierTurn;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getCourierTurn = async (courierTurn) => {
  try {
    const turn = await ZoneData.countDocuments({
      createdAt: { $lt: courierTurn.createdAt },
    });
    return turn;
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierInQueue = async (courierId) => {
  try {
    const inQueue = await ZoneData.findOne({ courierId: courierId });
    if (inQueue) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteCourierTurn = async (courierId) => {
  try {
    await ZoneData.deleteOne({ courierId: courierId });
  } catch (err) {
    throw new Error(err);
  }
};

exports.setCourierBusyStatus = async (courierId, state) => {
  try {
    const courierLog = await CourierLog.findOne({ courierId: courierId });
    if (!courierLog) {
      throw new Error("Courier has to login once at least!");
    }
    courierLog.isBusy = state;
    await courierLog.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.setCourierOrderStatus = async (courierId, state) => {
  try {
    const courierLog = await CourierLog.findOne({ courierId: courierId });
    courierLog.hasOrder = state;
    await courierLog.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierRejection = async (courierId, orderId, reason) => {
  try {
    const rejection = new Rejection({
      courierId,
      orderId,
      rejectionReason: reason,
    });
    await rejection.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.setCourierTimeout = async (courierId) => {
  try {
    const courier = await this.findCourier(courierId);
    const courierShift = await Shift.findById(courier.workingShiftId);
    const nowHour = new Date().getHours();
    const timeoutHours = courierShift.endingHour - nowHour;
    const timeoutId = setTimeout(async () => {
      await this.courierLogout(courierId);
    }, timeoutHours * 60 * 60 * 1000 + courierShift.endingMinute * 60 * 1000);
    const shiftTimeout = new ShiftTimeout({
      courierId,
      timeoutId,
      startTime: Date.now(),
      numberOfHours: courierShift.shiftHours,
    });
    await shiftTimeout.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.findCourierTimeout = async (courierId) => {
  try {
    const shifTimeout = await ShiftTimeout.findOne({ courierId: courierId });
    if (shifTimeout) {
      return { hasTimeout: true, timeoutId: shifTimeout.timeoutId };
    } else {
      return { hasTimeout: false };
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteShiftTimeout = async (courierId) => {
  try {
    const shifTimeout = await ShiftTimeout.findOne({ courierId: courierId });
    clearTimeout(shifTimeout.timeoutId);
    await ShiftTimeout.deleteOne({ courierId: courierId });
  } catch (err) {
    throw new Error(err);
  }
};

exports.extendCourierTimeout = async (courierId, hours) => {
  try {
    await this.deleteShiftTimeout(courierId);
    const timeoutId = setTimeout(async () => {
      await this.courierLogout(courierId);
    }, hours * 60 * 60 * 1000);
    const shiftTimeout = new ShiftTimeout({
      courierId,
      timeoutId,
      startTime: Date.now(),
      numberOfHours: hours,
    });
    await shiftTimeout.save();
    if (shiftTimeout) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierLogout = async (courierId) => {
  try {
    await this.deleteCourierTurn(courierId);
    const filter = { courierId: courierId };
    const updateData = {
      courierActive: false,
    };
    await CourierLog.updateOne(filter, updateData);
  } catch (err) {
    throw new Error(err);
  }
};

exports.sendOrder = async (username, order, courierId, areaId) => {
  try {
    const io = require("../socket").getIo();
    const courierSocket = await utilities.getSocketId(username);
    io.to(courierSocket).emit("order_assigned", order, async (ack) => {
      if (ack) {
        await this.setCourierBusyStatus(courierId, true);
        setTimeout(async () => {
          await orderServices.checkAcceptingOrder(
            areaId,
            order._id,
            courierSocket
          );
        }, process.env.order_timeout);
      }
    });
  } catch (err) {
    throw new Error(err);
  }
};

exports.getCourierOrders = async (courierId) => {
  try {
    const orders = await Order.find({ courierId: courierId }).populate(
      "courierId"
    );
    if (!orders) {
      throw new Error("No orders found for this courier");
    }
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getCouriersLogs = async () => {
  try {
    const couriersLocations = await CourierLog.find(
      { courierActive: true },
      { courierName: 1, location: 1, hasFridge: 1, hasOrder: 1, isBusy: 1 }
    );
    return couriersLocations;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getAvailableCouriers = async (order) => {
  try {
    const orderLocation = {
      type: "Point",
      coordinates: [order.fromPoint.lat, order.fromPoint.lng],
    };
    if (order.vehicleType !== "car") {
      const couriers = await CourierLog.find({
        hasFridge: true,
        hasOrder: false,
        courierActive: true,
        location: {
          $near: { $geometry: orderLocation },
        },
      }).lean();
      return couriers;
    } else {
      const couriers = await CourierLog.find({
        hasOrder: false,
        isBusy: false,
        courierActive: true,
        location: {
          $near: { $geometry: orderLocation },
        },
      }).lean();
      return couriers;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteCourierAccount = async (courierId) => {
  try {
    await Courier.findByIdAndDelete(courierId);
    return res.status(200).json({ success: tru });
  } catch (err) {
    throw new Error(err);
  }
};
