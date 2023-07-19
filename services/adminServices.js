const User = require("../models/users");
const Courier = require("../models/courier");
const Area = require("../models/area");
const Shift = require("../models/shift");
const Pricing = require("../models/pricing");
const rdsClient = require("../config/redisConnect");

// USERS SERVICES //

exports.createUser = async (userData) => {
  try {
    const user = new User({
      employeeName: userData.employeeName,
      phoneNumber: userData.phoneNumber,
      username: userData.username,
      role: userData.role,
      password: userData.password,
    });
    await user.save();
    return user;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findDashboardUser = async (username) => {
  try {
    let user = await User.findOne({ username: username });
    return user;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findUser = async (username) => {
  try {
    let user = await User.findOne({ username: username });
    if (!user) {
      user = await Courier.findOne({ username: username });
      if (!user) {
        const error = new Error("user not found or incorrect username!");
        error.statusCode = 422;
        throw error;
      }
    }
    return user;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getAllUsers = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (err) {
    throw new Error(err);
  }
};

exports.editUser = async (userId, updatedData) => {
  try {
    const user = await User.findById(userId);
    user.employeeName =
      updatedData.employeeName !== ""
        ? updatedData.employeeName
        : user.employeeName;
    user.phoneNumber =
      updatedData.phoneNumber !== ""
        ? updatedData.phoneNumber
        : user.phoneNumber;
    user.role = updatedData.role !== "" ? updatedData.role : user.role;
    await user.save();
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteUser = async (userId) => {
  try {
    await User.findByIdAndDelete(userId);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

// COURIER SERVICES //

exports.getLastCourierUsername = async () => {
  try {
    const couriers = await Courier.find({}).sort({ username: -1 });
    const lastCourier = couriers[0];
    let username = 1000;
    if (!couriers) {
      return username;
    }
    username = lastCourier.username + 1;
    return username;
  } catch (err) {
    throw new Error(err);
  }
};

exports.createCourier = async (courierData) => {
  try {
    const courier = new Courier(courierData);
    await courier.save();
    return courier;
  } catch (err) {
    throw new Error(err);
  }
};

// AREAS SERVICES //

exports.createArea = async (areaData) => {
  try {
    const area = new Area(areaData);
    await area.save();
    return area;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getArea = async (areaId) => {
  try {
    const area = await Area.findById(areaId);
    return area;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getAreas = async () => {
  try {
    const areas = await Area.find();
    return areas;
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteArea = async (areaId) => {
  try {
    const couriers = await Courier.find({ workingAreaId: areaId });
    if (couriers.length > 0) {
      throw new Error("This area has couriers!");
    }
    const deletedArea = await Area.findByIdAndDelete(areaId);
    if (deletedArea) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.cachedAreas = async ()=>{
  try{
    const cacheDB = rdsClient.getRedisConnection();
    const areasData = await cacheDB.hGetAll("GEOMETRY");
    const areas = JSON.parse(areasData.areas);
    return areas; 
  }catch(err){
    throw new Error(err);
  }
}

// SHIFTS SERVICES //

exports.createShift = async (shiftData) => {
  try {
    const shift = new Shift(shiftData);
    await shift.save();
    return shift;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getShift = async (shiftId) => {
  try {
    const shift = await Shift.findById(shiftId);
    return shift;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getAllShifts = async () => {
  try {
    const shifts = await Shift.find();
    return shifts;
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateShift = async (shiftId, shiftData) => {
  try {
    const updated = await Shift.findByIdAndUpdate(shiftId, shiftData);
    if (!updated) {
      throw new Error("Could not update shift!");
    } else {
      return true;
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteShift = async (shiftId) => {
  try {
    const couriers = await Courier.find({ workingShiftId: shiftId });
    if (couriers.length > 0) {
      throw new Error("This shift has couriers!");
    }
    const shiftDeleted = await Shift.findByIdAndDelete(shiftId);
    if (!shiftDeleted) {
      throw new Error("Could not delete shift!");
    } else {
      return true;
    }
  } catch (err) {
    throw new Error(err);
  }
};

// PRICING SERVICES //

exports.SetPricing = async (pricingData) => {
  try {
    let price = await Pricing.findOne({
      pricingCategory: pricingData.pricingCategory,
    });
    if (price) {
      price.pricePerKilometer = pricingData.pricePerKilometer;
      price.minimumPrice = pricingData.minimumPrice;
      await price.save();
      return true;
    } else {
      price = new Pricing({
        pricingCategory: pricingData.pricingCategory,
        pricePerKilometer: pricingData.pricePerKilometer,
        minimumPrice: pricingData.minimumPrice,
      });
      await price.save();
      return true;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.getPricing = async (pricingCategory) => {
  try {
    const pricing = await Pricing.findOne({ pricingCategory: pricingCategory });
    if (!pricing) {
      throw new Error("Pricing is not set");
    }
    return pricing;
  } catch (err) {
    throw new Error(err);
  }
};

exports.pricesList = async () => {
  try {
    const prices = await Pricing.find();
    if (!prices) {
      throw new Error("Prices list not found!");
    }
    return prices;
  } catch (err) {
    throw new Error(err);
  }
};
