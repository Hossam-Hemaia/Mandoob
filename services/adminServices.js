const User = require("../models/users");
const Courier = require("../models/courier");
const Area = require("../models/area");
const Shift = require("../models/shift");
const Pricing = require("../models/pricing");
const FoodZone = require("../models/foodZone");
const Farm = require("../models/farm");
const Item = require("../models/item");
const Farmer = require("../models/farmer");
const Supervisor = require("../models/supervisors");
const rdsClient = require("../config/redisConnect");
/*************************************
 * USERS SERVICES
 *************************************/
exports.createUser = async (userData) => {
  try {
    let user;
    if (userData.role === "farmer") {
      user = new Farmer(userData);
    } else if (userData.role === "user") {
      user = new Supervisor(userData);
    } else {
      user = new User({
        employeeName: userData.employeeName,
        phoneNumber: userData.phoneNumber,
        username: userData.username,
        role: userData.role,
        password: userData.password,
      });
    }
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
    user.role === "farmer"
      ? (user.farmId =
          updatedData.farmId !== "" ? updatedData.farmId : user.farmId)
      : user.farmId;
    user.couriersIds =
      updatedData.couriersIds?.length > 0
        ? updatedData.couriersIds
        : user.couriersIds;
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
/*************************************
 * COURIERS SERVICES
 *************************************/
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
/*************************************
 * AREAS SERVICES
 *************************************/
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

exports.cachedAreas = async () => {
  try {
    const cacheDB = rdsClient.getRedisConnection();
    const areasData = await cacheDB.hGetAll("GEOMETRY");
    const areas = JSON.parse(areasData.areas);
    return areas;
  } catch (err) {
    throw new Error(err);
  }
};
/*************************************
 * SHIFTS SERVICES
 *************************************/
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
/*************************************
 * PRICING SERVICES
 *************************************/
exports.SetPricing = async (pricingData) => {
  try {
    let price = await Pricing.findOne({
      pricingCategory: pricingData.pricingCategory,
    });
    if (price) {
      price.pricePerKilometer = pricingData.pricePerKilometer;
      price.minimumPrice = pricingData.minimumPrice;
      price.fridgePrice = pricingData.fridgePrice;
      await price.save();
      return true;
    } else {
      price = new Pricing({
        pricingCategory: pricingData.pricingCategory,
        pricePerKilometer: pricingData.pricePerKilometer,
        minimumPrice: pricingData.minimumPrice,
        fridgePrice: pricingData.fridgePrice,
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
/*************************************
 * FOOD/SHOPS ZONE SERVICES
 *************************************/
exports.createFoodZone = async (foodZoneData) => {
  try {
    const foodZone = new FoodZone(foodZoneData);
    await foodZone.save();
    return foodZone;
  } catch (err) {
    throw new Error(err);
  }
};

exports.foodZones = async () => {
  try {
    const foodZones = await FoodZone.find();
    return foodZones;
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteFoodZone = async (foodZoneId) => {
  try {
    await FoodZone.findByIdAndDelete(foodZoneId);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};
/*************************************
 * FOOD/SHOPS SERVICES
 *************************************/
exports.createFarm = async (farmData) => {
  try {
    const farm = new Farm(farmData);
    await farm.save();
    return farm;
  } catch (err) {
    throw new Error(err);
  }
};

exports.allBusiness = async () => {
  try {
    const farms = await Farm.find().populate("foodZoneId");
    return farms;
  } catch (err) {
    throw new Error(err);
  }
};

exports.allFarms = async (category) => {
  try {
    const farms = await Farm.find({ category: category });
    return farms;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getFarm = async (farmId) => {
  try {
    const farm = await Farm.findById(farmId);
    if (!farm) {
      throw new Error("No famr found!");
    }
    return farm;
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteFarm = async (farmId) => {
  try {
    await Farm.findByIdAndDelete(farmId);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};
/*************************************
 * FOOD/SHOPS ITEM SERVICES
 *************************************/
exports.createItem = async (itemData) => {
  try {
    const item = new Item(itemData);
    await item.save();
    return item;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getFarmsItems = async () => {
  try {
    const items = await Item.find().populate("farmId");
    return items;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getFarmItems = async (farmId) => {
  try {
    const items = await Item.find({ farmId: farmId });
    return items;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getClientFarmsItems = async () => {
  try {
    const items = await Item.find({ itemBlocked: false }).populate("farmId");
    return items;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getLimitedFarmsItems = async () => {
  try {
    const items = await Item.find({ itemBlocked: false })
      .populate("farmId")
      .limit(10);
    return items;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getFarmItem = async (itemId) => {
  try {
    const item = await Item.findById(itemId);
    return item;
  } catch (err) {
    throw new Error(err);
  }
};

exports.editItem = async (itemId, itemData) => {
  try {
    const updateData = {};
    for (let key in itemData) {
      if (itemData[key] !== "") {
        updateData[key] = itemData[key];
      }
    }
    const updated = await Item.findByIdAndUpdate(itemId, updateData);
    return updated;
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteItem = async (itemId) => {
  try {
    const deleted = await Item.findByIdAndDelete(itemId);
    return deleted;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getItemsByFarmId = async (farmId) => {
  try {
    const farmItems = await Item.find({ farmId: farmId, itemBlocked: false });
    return farmItems;
  } catch (err) {
    throw new Error(err);
  }
};
