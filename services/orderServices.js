const rdsClient = require("../config/redisConnect");
const Order = require("../models/order");
const utilities = require("../utils/utilities");
const adminServices = require("../services/adminServices");
const clientServices = require("../services/clientServices");
const courierServices = require("../services/courierServices");

exports.createOrder = async (orderDetails) => {
  try {
    const currentDate = utilities.getLocalDate(new Date());
    const order = new Order({
      fromAddress: orderDetails.fromAddress,
      toAddress: orderDetails.toAddress,
      fromPoint: {
        lat: orderDetails.fromPoint.lat,
        lng: orderDetails.fromPoint.lng,
      },
      toPoint: {
        lat: orderDetails.toPoint.lat,
        lng: orderDetails.toPoint.lng,
      },
      parcelImage: orderDetails.parcelImage || "",
      attachment: orderDetails.attachment,
      parcelName: orderDetails.parcelName,
      parcelType: orderDetails.parcelType,
      vehicleType: orderDetails.vehicleType,
      senderName: orderDetails.senderName,
      senderPhone: orderDetails.senderPhone,
      receiverName: orderDetails.receiverName,
      receiverPhone: orderDetails.receiverPhone,
      deliveryPrice: orderDetails.deliveryPrice,
      payer: orderDetails.payer,
      paymentStatus: orderDetails.paymentStatus,
      paymentType: orderDetails.paymentType,
      orderStatus: [{ state: "pending", date: currentDate }],
      serviceType: orderDetails.serviceType,
      orderType: orderDetails.orderType,
      orderDate: orderDetails.orderDate,
      orderTime: orderDetails.orderTime,
      companyName: orderDetails.companyName,
      businessType: orderDetails.businessType,
      clientId: orderDetails.clientId,
      orderItems: orderDetails.orderItems,
      notes: orderDetails.notes,
    });
    await order.save();
    return order;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findAllOrders = async (page, ITEMS_PER_PAGE) => {
  try {
    const orders = await Order.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .sort({ orderType: -1 });
    if (!orders) {
      throw new Error("No orders found!");
    }
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findOrderByServiceType = async (serviceType, page, ITEMS_PER_PAGE) => {
  try {
    const orders = await Order.find({ serviceType: serviceType })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    if (!orders) {
      throw new Error("No orders found!");
    }
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate([
      "clientId",
      "courierId",
    ]);
    return order;
  } catch (err) {
    throw new Error(err);
  }
};

exports.findClientOrders = async (clientId) => {
  try {
    const orders = await Order.find({ clientId: clientId }).sort({
      createdAt: -1,
    });
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};

exports.assignOrder = async (orderId, courier) => {
  try {
    const currentDate = utilities.getLocalDate(new Date());
    const order = await Order.findById(orderId).populate("clientId");
    order.orderStatus.push({ state: "accepted", date: currentDate });
    order.courierId = courier._id;
    order.orderType = "instant";
    await order.save();
    return order;
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateOrderStatus = async (orderId, status) => {
  try {
    const currentDate = utilities.getLocalDate(new Date());
    const order = await Order.findById(orderId);
    order.orderStatus.push({ state: status, date: currentDate });
    await order.save();
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

exports.pushOrderToQueue = async (areaId, orderId) => {
  try {
    console.log("Pushing order to queue..");
    cacheDB = rdsClient.getRedisConnection();
    await cacheDB.rPush(`${areaId}`, JSON.stringify(orderId));
  } catch (err) {
    throw new Error(err);
  }
};

exports.checkAcceptingOrder = async (areaId, orderId, oldCourierSocket) => {
  try {
    const order = await Order.findById(orderId);
    const lastState = order.orderStatus[order.orderStatus.length - 1];
    const io = require("../socket").getIo();
    if (lastState.state === "pending") {
      console.log("transfering order...");
      const needFridge = order.vehicleType === "car" ? false : true;
      const nextCourier = await clientServices.findCourier(areaId, needFridge);
      if (!nextCourier) {
        this.pushOrderToQueue(areaId, orderId);
        io.to(oldCourierSocket).emit("order_timed_out", { timeout: true });
        io.emit(
          "no_response",
          {
            message: "Courier did not take any action, order set to queue!",
          },
          (ack) => {
            console.log(ack);
          }
        );
        return;
      }
      const courierSocket = await utilities.getSocketId(nextCourier.username);
      io.to(oldCourierSocket).emit("order_timed_out", { timeout: true });
      io.to(courierSocket).emit("order_assigned", order);
      await courierServices.setCourierBusyStatus(nextCourier.courierId, true);
      setTimeout(async () => {
        await this.checkAcceptingOrder(areaId, orderId, courierSocket);
      }, process.env.order_timeout);
    } else {
      return;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.getOrderFromQueue = async (areaId) => {
  try {
    const cacheDB = rdsClient.getRedisConnection();
    const areaQueueLength = await cacheDB.lLen(`${areaId}`);
    if (areaQueueLength <= 0) {
      return false;
    } else {
      const queueTurn = await cacheDB.lPop(`${areaId}`);
      const orderId = JSON.parse(queueTurn);
      console.log(orderId);
      const order = await this.findOrder(orderId);
      return order;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateOrderData = async (orderId, updateData) => {
  try {
    const orderUpdated = await Order.findByIdAndUpdate(orderId, updateData);
    if (!orderUpdated) {
      throw new Error("Order update failed!");
    }
    return orderUpdated;
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteOrder = async (orderId) => {
  try {
    const orderDeleted = await Order.findByIdAndDelete(orderId);
    if (!orderDeleted) {
      throw new Error("Cannot delete order!");
    }
    return orderDeleted;
  } catch (err) {
    throw new Error(err);
  }
};

exports.QueuedOrders = async () => {
  try {
    const cacheDB = rdsClient.getRedisConnection();
    const areas = await adminServices.getAreas();
    const queuedOrders = [];
    for (let area of areas) {
      const areaQueueLength = await cacheDB.lLen(`${area._id}`);
      let areaDetails = {};
      if (areaQueueLength > 0) {
        areaDetails.areaName = area.areaName;
        areaDetails.numberOfOrders = areaQueueLength;
        queuedOrders.push(areaDetails);
      }
    }
    return queuedOrders;
  } catch (err) {
    throw new Error(err);
  }
};
