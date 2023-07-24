const clientServices = require("../services/clientServices");
const orderServices = require("../services/orderServices");
const courierServices = require("../services/courierServices");
const adminServices = require("../services/adminServices");
const utilities = require("../utils/utilities");

exports.getDeliveryData = async (req, res, next) => {
  const {
    fromPointLat,
    fromPointLng,
    toPointLat,
    toPointLng,
    pricingCategory,
  } = req.query;
  try {
    const fromPoint = { lat: fromPointLat, lng: fromPointLng };
    const toPoint = { lat: toPointLat, lng: toPointLng };
    const fromArea = await utilities.findArea(fromPoint);
    if (!fromArea) {
      const error = new Error("Your location is not covered!");
      error.statusCode = 404;
      throw error;
    }
    const toArea = await utilities.findArea(toPoint);
    if (!toArea) {
      const error = new Error("Destination location is not covered!");
      error.statusCode = 404;
      throw error;
    }
    const locations = { fromPoint, toPoint };
    const data = await utilities.getDeliveryRoute(locations, false);
    const deliveryRoute = data.paths[0].points;
    const distance = data.paths[0].distance / 1000;
    const estimatedTime = data.paths[0].time / 1000 / 60;
    const pricing = await adminServices.getPricing(pricingCategory);
    let price = distance * pricing.pricePerKilometer;
    if (price < pricing.minimumPrice) {
      price = pricing.minimumPrice;
    }
    res.status(200).json({
      success: true,
      data: {
        route: deliveryRoute,
        km: distance,
        time: estimatedTime,
        price: price,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.postCreateOrder = async (req, res, next) => {
  const {
    fromAddress,
    toAddress,
    fromPoint,
    toPoint,
    parcelName,
    parcelType,
    vehicleType,
    senderName,
    senderPhone,
    receiverName,
    receiverPhone,
    deliveryPrice,
    payer,
    paymentType,
    serviceType,
    orderType,
    orderDate,
    orderTime,
    companyName,
    businessType,
    orderItems,
    notes,
  } = req.body;
  try {
    const client = await clientServices.findClient(req.clientId);
    let parcelImage;
    let attachments = [];
    // if (serviceType === "individual") {
    //   const image = req.files[0];
    //   if (image) {
    //     parcelImage = `${req.protocol}s://${req.get("host")}/${image.path}`;
    //   }
    // } else if (serviceType === "task") {
    //   const files = req.files;
    //   if (files) {
    //     for (let file of files) {
    //       let document = `${req.protocol}s://${req.get("host")}/${file.path}`;
    //       attachments.push(document);
    //     }
    //   }
    // }
    const orderDetails = {
      fromAddress,
      toAddress,
      fromPoint,
      toPoint,
      parcelImage,
      attachments: attachments,
      parcelName,
      parcelType,
      vehicleType,
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      deliveryPrice,
      payer,
      paymentStatus: paymentType === "cash" ? "pending" : "paid",
      paymentType,
      serviceType,
      orderType,
      orderDate:
        orderType === "instant"
          ? utilities.getLocalDate(new Date())
          : utilities.getLocalDate(orderDate),
      orderTime,
      companyName,
      businessType,
      clientId: client._id,
      orderItems,
      notes,
    };
    const area = await utilities.findArea(fromPoint);
    if (orderType === "instant") {
      const newOrder = await orderServices.createOrder(orderDetails);
      if (!newOrder) {
        const error = new Error("creating order failed!");
        error.statusCode = 422;
        throw error;
      }
      const needFridge = vehicleType !== "car" ? true : false;
      const courier = await clientServices.findCourier(area.areaId, needFridge);
      if (!courier) {
        await orderServices.pushOrderToQueue(area.areaId, newOrder._id);
        return res.status(201).json({
          success: true,
          orderId: newOrder._id,
          message: "Order Created!",
        });
      }
      courierServices.sendOrder(
        courier.username,
        newOrder,
        courier.courierId,
        area.areaId
      );
      return res.status(201).json({
        success: true,
        orderId: newOrder._id,
        message: "Order Created!",
      });
    } else if (orderType === "postponed") {
      const newOrder = await orderServices.createOrder(orderDetails);
      if (!newOrder) {
        const error = new Error("creating order failed!");
        error.statusCode = 422;
        throw error;
      }
      return res.status(201).json({
        success: true,
        orderId: newOrder._id,
        message: "Order Created!",
      });
    } else if (orderType === "food") {
    }
  } catch (err) {
    next(err);
  }
};

exports.getClientOrder = async (req, res, next) => {
  const orderId = req.query.orderId;
  try {
    const order = await orderServices.findOrder(orderId);
    if (!order) {
      const error = new Error("Order not found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, order: order });
  } catch (err) {
    next(err);
  }
};

exports.getClientOrders = async (req, res, next) => {
  const clientId = req.clientId;
  try {
    const orders = await orderServices.findClientOrders(clientId);
    if (!orders) {
      const error = new Error("Order not found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, orders: orders });
  } catch (err) {
    next(err);
  }
};
