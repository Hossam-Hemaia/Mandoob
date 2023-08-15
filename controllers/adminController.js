const bcrypt = require("bcryptjs");
const adminServices = require("../services/adminServices");
const courierServices = require("../services/courierServices");
const orderServices = require("../services/orderServices");

// USERS CONTROLLERS //

exports.postCreateUser = async (req, res, next) => {
  const { employeeName, phoneNumber, role, password, confirmPassword } =
    req.body;
  try {
    if (password !== confirmPassword) {
      const error = new Error("password does not match!");
      error.statusCode = 422;
      throw error;
    }
    const userExist = await adminServices.findDashboardUser(phoneNumber);
    if (userExist) {
      throw new Error("User already exist!");
    }
    const validPhoneNumber = phoneNumber.split("-").join("");
    console.log(validPhoneNumber);
    const hashedPassword = await bcrypt.hash(password, 12);
    const userData = {
      employeeName,
      phoneNumber,
      username: validPhoneNumber,
      role,
      password: hashedPassword,
    };
    const newUser = await adminServices.createUser(userData);
    if (!newUser) {
      const error = new Error("Could not create new user!");
      error.statusCode = 422;
      throw error;
    }
    res.status(201).json({
      success: true,
      username: newUser.username,
      password: password,
      role: newUser.role,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await adminServices.getAllUsers();
    if (!users) {
      const error = new Error("No users found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, users: users });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  const userId = req.query.userId;
  try {
    const user = await adminServices.getUserById(userId);
    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, user: user });
  } catch (err) {
    next(err);
  }
};

exports.putEditUser = async (req, res, next) => {
  const { employeeName, phoneNumber, role, userId } = req.body;
  try {
    const updatedData = { employeeName, phoneNumber, role };
    const updated = await adminServices.editUser(userId, updatedData);
    if (!updated) {
      const error = new Error("User not found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(201).json({ success: true, message: "User updated" });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const userId = req.query.userId;
  try {
    await adminServices.deleteUser(userId);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully!" });
  } catch (err) {
    next(err);
  }
};

// COURIER CONTROLLERS //
exports.postCreateCourier = async (req, res, next) => {
  const {
    courierName,
    birthdate,
    phoneNumber,
    licenseNumber,
    companyName,
    carBrand,
    carModel,
    plateNumber,
    workingAreaId,
    workingShiftId,
    password,
    confirmPassword,
    hasFridge,
  } = req.body;
  try {
    if (password !== confirmPassword) {
      const error = new Error("password does not match!");
      error.statusCode = 422;
      throw error;
    }
    const baseUrl = `${req.protocol}s://${req.get("host")}`;
    const documents = [];
    for (let file of req.files) {
      documents.push(`${baseUrl}/${file.path}`);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const username = await adminServices.getLastCourierUsername();
    const courierData = {
      courierName,
      birthdate: new Date(birthdate),
      phoneNumber,
      licenseNumber,
      companyName,
      carBrand,
      carModel,
      plateNumber,
      documents,
      workingAreaId,
      workingShiftId,
      hasFridge,
      username,
      password: hashedPassword,
    };
    const courier = await adminServices.createCourier(courierData);
    if (!courier) {
      const error = new Error("Could not create new courier!");
      error.statusCode = 422;
      throw error;
    }
    res
      .status(201)
      .json({ success: true, username: courier.username, password: password });
  } catch (err) {
    next(err);
  }
};

exports.getAllCouriers = async (req, res, next) => {
  try {
    const couriers = await courierServices.findAllCouriers();
    res.status(200).json({ success: true, couriers: couriers });
  } catch (err) {
    next(err);
  }
};

exports.getCourier = async (req, res, next) => {
  const courierId = req.query.courierId;
  try {
    const courier = await courierServices.getCourierData(courierId);
    res.status(200).json({ success: true, courier: courier });
  } catch (err) {
    next(err);
  }
};

exports.puteditCourier = async (req, res, next) => {
  const {
    courierName,
    birthdate,
    phoneNumber,
    licenseNumber,
    companyName,
    carBrand,
    carModel,
    plateNumber,
    workingAreaId,
    workingShiftId,
    courierId,
  } = req.body;
  try {
    const baseUrl = `${req.protocol}s://${req.get("host")}`;
    const documents = [];
    if (req.files) {
      for (let file of req.files) {
        documents.push(`${baseUrl}/${file.path}`);
      }
    }
    const courierData = {
      courierName,
      birthdate: new Date(birthdate),
      phoneNumber,
      licenseNumber,
      companyName,
      carBrand,
      carModel,
      plateNumber,
      documents: documents,
      workingAreaId,
      workingShiftId,
      courierId,
    };
    await courierServices.editCourier(courierData);
    res.status(201).json({ success: true, message: "courier updated!" });
  } catch (err) {
    next(err);
  }
};
// Deleting Courier
exports.deleteCourier = async (req, res, next) => {
  const courierId = req.query.courierId;
  try {
    await courierServices.removeCourier(courierId);
    res.status(200).json({ success: true, message: "Courier Deleted" });
  } catch (err) {
    next(err);
  }
};

exports.postExtendCourierShift = async (req, res, next) => {
  const { courierId, numberOfHours } = req.body;
  try {
    const shiftIsSet = await courierServices.extendCourierTimeout(
      courierId,
      numberOfHours
    );
    if (shiftIsSet) {
      res
        .status(201)
        .json({ success: true, message: "Courier shift is extended" });
    }
  } catch (err) {
    next(err);
  }
};

exports.putCourierBusyStatus = async (req, res, next) => {
  const { courierId, state } = req.body;
  try {
    await courierServices.setCourierBusyStatus(courierId, state);
    res
      .status(200)
      .json({ success: true, message: "courier busy status updated" });
  } catch (err) {
    next(err);
  }
};

exports.getCourierOrders = async (req, res, next) => {
  try {
    const courierId = req.query.courierId;
    const orders = await courierServices.getCourierOrders(courierId);
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// AREA CONTROLLERS //

exports.postCreateArea = async (req, res, next) => {
  const { zoneName, areaName, areaPolygon } = req.body;
  try {
    console.log(areaPolygon, zoneName);
    const areaData = {
      zoneName,
      areaName,
      areaPolygon: JSON.parse(areaPolygon),
    };
    const area = await adminServices.createArea(areaData);
    if (!area) {
      const error = new Error("Could not create new area!");
      error.statusCode = 422;
      throw error;
    }
    res.status(201).json({ success: true, message: "New Area Created" });
  } catch (err) {
    next(err);
  }
};

exports.getAreas = async (req, res, next) => {
  try {
    const areas = await adminServices.getAreas();
    res.status(200).json({ success: true, areas: areas });
  } catch (err) {
    next(err);
  }
};

exports.getArea = async (req, res, next) => {
  try {
    const areaId = req.query.areaId;
    const area = await adminServices.getArea(areaId);
    res.status(200).json({ success: true, area: area });
  } catch (err) {
    next(err);
  }
};

exports.deleteArea = async (req, res, next) => {
  try {
    const areaId = req.query.areaId;
    const areaDeleted = await adminServices.deleteArea(areaId);
    if (areaDeleted) {
      return res
        .status(200)
        .json({ success: true, message: "Area has been deleted" });
    } else {
      const error = new Error("Area could not be deleted");
      error.statusCode = 422;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

exports.getAdjustedAreas = async (req, res, next) => {
  try {
    const areas = await adminServices.cachedAreas();
    res.status(200).json({ success: true, areas });
  } catch (err) {
    next(err);
  }
};

// SHIFT CONTROLLERS //

exports.postCreateShift = async (req, res, next) => {
  const { shiftHours, startingHour, startingMinute } = req.body;
  try {
    if (shiftHours > 24 || startingHour > 24 || startingMinute > 59) {
      const error = new Error("Invalid shift input!");
      error.statusCode = 422;
      throw error;
    }
    const endingHour =
      shiftHours + startingHour > 24
        ? shiftHours + startingHour - 24
        : shiftHours + startingHour;
    const endingMinute = startingMinute;
    const shiftData = {
      shiftHours,
      startingHour,
      startingMinute,
      endingHour,
      endingMinute,
    };
    const shift = await adminServices.createShift(shiftData);
    if (!shift) {
      const error = new Error("Could not create new shift!");
      error.statusCode = 422;
      throw error;
    }
    res.status(201).json({ success: true, message: "New shift created!" });
  } catch (err) {
    next(err);
  }
};

exports.getAllShifts = async (req, res, next) => {
  try {
    const shifts = await adminServices.getAllShifts();
    res.status(200).json({ success: true, shifts: shifts });
  } catch (err) {
    next(err);
  }
};

exports.getShift = async (req, res, next) => {
  try {
    const shiftId = req.query.shiftId;
    const shift = await adminServices.getShift(shiftId);
    res.status(200).json({ success: true, shift: shift });
  } catch (err) {
    next(err);
  }
};

exports.editShift = async (req, res, next) => {
  try {
    const { shiftHours, startingHour, startingMinute, shiftId } = req.body;
    const endingHour =
      shiftHours + startingHour > 24
        ? shiftHours + startingHour - 24
        : shiftHours + startingHour;
    const endingMinute = startingMinute;
    const shiftData = {
      shiftHours,
      startingHour,
      startingMinute,
      endingHour,
      endingMinute,
    };
    const updated = await adminServices.updateShift(shiftId, shiftData);
    if (updated) {
      return res
        .status(200)
        .json({ success: true, message: "shift updated successfully" });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteShift = async (req, res, next) => {
  try {
    const shiftId = req.query.shiftId;
    await adminServices.deleteShift(shiftId);
    res
      .status(200)
      .json({ success: true, message: "shift deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ORDER CONTROLLERS //

exports.getAllOrders = async (req, res, next) => {
  try {
    const ITEMS_PER_PAGE = 200;
    const page = +req.query.page;
    const orders = await orderServices.findAllOrders(page, ITEMS_PER_PAGE);
    const totalOrders = orders.length;
    res.status(200).json({
      success: true,
      data: {
        orders: orders,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: page,
        hasNextPage: page * ITEMS_PER_PAGE < totalOrders,
        nextPage: page + 1,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalOrders / ITEMS_PER_PAGE),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrdersByServiceType = async (req, res, next) => {
  try {
    const serviceType = req.query.serviceType;
    const ITEMS_PER_PAGE = 200;
    const page = +req.query.page;
    const orders = await orderServices.findOrderByServiceType(
      serviceType,
      page,
      ITEMS_PER_PAGE
    );
    const totalOrders = orders.length;
    res.status(200).json({
      success: true,
      data: {
        orders: orders,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: page,
        hasNextPage: page * ITEMS_PER_PAGE < totalOrders,
        nextPage: page + 1,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalOrders / ITEMS_PER_PAGE),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const orderId = req.query.orderId;
    const order = await orderServices.findOrder(orderId);
    res.status(200).json({ success: true, order: order });
  } catch (err) {
    next(err);
  }
};

exports.putEditOrder = async (req, res, next) => {
  try {
    const {
      fromAddress,
      toAddress,
      parcelName,
      parcelType,
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      deliveryPrice,
      payer,
      paymentType,
      paymentStatus,
      serviceType,
      notes,
      orderId,
    } = req.body;
    const updateData = {
      fromAddress,
      toAddress,
      parcelName,
      parcelType,
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      deliveryPrice,
      payer,
      paymentType,
      paymentStatus,
      serviceType,
      notes,
    };
    await orderServices.updateOrderData(orderId, updateData);
    res.status(201).json({ success: true, message: "Order Updated" });
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const orderId = req.query.orderId;
    const deletedOrder = await orderServices.deleteOrder(orderId);
    res.status(200).json({ success: true, message: "Order deleted" });
  } catch (err) {
    next(err);
  }
};

exports.getQueuedOrders = async (req, res, next) => {
  try {
    const orders = await orderServices.QueuedOrders();
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

exports.getAvailableCouriers = async (req, res, next) => {
  try {
    const orderId = req.query.orderId;
    const order = await orderServices.findOrder(orderId);
    const couriers = await courierServices.getAvailableCouriers(order);
    if (!couriers) {
      throw new Error("All couriers are not available!");
    }
    res.status(200).json({ success: true, couriers });
  } catch (err) {
    next(err);
  }
};

// PRICING CONTROLLERS //

exports.postSetPricing = async (req, res, next) => {
  const { pricingCategory, pricePerKilometer, minimumPrice } = req.body;
  try {
    const pricingData = {
      pricingCategory,
      pricePerKilometer,
      minimumPrice,
    };
    const priceSet = await adminServices.SetPricing(pricingData);
    if (priceSet) {
      return res.status(201).json({ success: true, message: "Pricing is set" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getPrices = async (req, res, next) => {
  try {
    const pricingCategory = req.query.pricingCategory;
    const prices = await adminServices.getPricing(pricingCategory);
    res.status(200).json({ success: true, prices: prices });
  } catch (err) {
    next(err);
  }
};

exports.getPricesList = async (req, res, next) => {
  try {
    const prices = await adminServices.pricesList();
    res.status(200).json({ success: true, prices: prices });
  } catch (err) {
    next(err);
  }
};

// Food Zone Controllers //

exports.createFoodZone = async (req, res, next) => {
  try {
    const { zoneName, location } = req.body;
    const foodZoneData = {
      zoneName,
      location,
    };
    const foodZone = await adminServices.createFoodZone(foodZoneData);
    if (foodZone) {
      return res
        .status(201)
        .json({ success: true, message: "New food zone created!" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getFoodZones = async (req, res, next) => {
  try {
    const foodZones = await adminServices.foodZones();
    res.status(200).json({ success: true, foodZones });
  } catch (err) {
    next(err);
  }
};

exports.deleteFoodZone = async (req, res, next) => {
  try {
    const foodZoneId = req.query.foodZoneId;
    const foodZoneDeleted = await adminServices.deleteFoodZone(foodZoneId);
    if (foodZoneDeleted) {
      return res
        .status(200)
        .json({ success: true, message: "Food zone deleted!" });
    }
  } catch (err) {
    next(err);
  }
};

// Farm Controllers //

exports.postCreateFarm = async (req, res, next) => {
  try {
    const { farmName, foodZoneId } = req.body;
    const farmData = {
      farmName,
      foodZoneId,
    };
    const farm = await adminServices.createFarm(farmData);
    if (farm) {
      return res.status(201).json({ success: true, message: "Farm Created!" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getFarms = async (req, res, next) => {
  try {
    const farms = await adminServices.allFarms();
    res.status(200).json({ success: true, farms });
  } catch (err) {
    next(err);
  }
};

exports.getFarm = async (req, res, next) => {
  try {
    const farmId = req.query.farmId;
    const farm = await adminServices.getFarm(farmId);
    res.status(200).json({ success: true, farm });
  } catch (err) {
    next(err);
  }
};

exports.deleteFarm = async (req, res, next) => {
  try {
    const farmId = req.query.farmId;
    await adminServices.deleteFarm(farmId);
    res.status(200).json({ success: true, message: "Farm Deleted!" });
  } catch (err) {
    next(err);
  }
};

// Farm Items Controllers //

exports.postCreateFarmItem = async (req, res, next) => {
  try {
    const { itemName, pricingSystem, itemPrice, farmId, itemBlocked } =
      req.body;
    let itemImage;
    if (req.files.length > 0) {
      const image = req.files[0];
      if (image) {
        itemImage = `${req.protocol}s://${req.get("host")}/${image.path}`;
      }
    }
    const itemData = {
      itemName,
      pricingSystem,
      itemPrice,
      itemImage,
      farmId,
      itemBlocked,
    };
    const item = await adminServices.createItem(itemData);
    if (item) {
      return res.status(201).json({ success: true, message: "Item Created!" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getFarmItems = async (req, res, next) => {
  try {
    const items = await adminServices.getFarmsItems();
    res.status(200).json({ success: true, items });
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const itemId = req.query.itemId;
    const item = await adminServices.getFarmItem(itemId);
    res.status(200).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

exports.putEditFarmItem = async (req, res, next) => {
  try {
    const { itemName, pricingSystem, itemPrice, farmId, itemBlocked, itemId } =
      req.body;
    let itemImage = "";
    if (req.files.length > 0) {
      const image = req.files[0];
      if (image) {
        itemImage = `${req.protocol}s://${req.get("host")}/${image.path}`;
      }
    }
    const itemData = {
      itemName,
      pricingSystem,
      itemPrice,
      itemImage,
      farmId,
      itemBlocked,
    };
    const updated = await adminServices.editItem(itemId, itemData);
    if (updated) {
      return res.status(200).json({ success: true, message: "item updated" });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const itemId = req.query.itemId;
    const deleted = await adminServices.deleteItem(itemId);
    if (deleted) {
      return res.status(200).json({ success: true, message: "item deleted!" });
    }
  } catch (err) {
    next(err);
  }
};
