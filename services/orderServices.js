const rdsClient = require("../config/redisConnect");
const Order = require("../models/order");
const Farm = require("../models/farm");
const utilities = require("../utils/utilities");
const adminServices = require("../services/adminServices");
const clientServices = require("../services/clientServices");
const courierServices = require("../services/courierServices");

exports.createOrder = async (orderDetails) => {
  try {
    console.log(orderDetails.attachments);
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
      attachments: orderDetails.attachments,
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
      .sort({ orderType: -1, createdAt: -1 })
      .populate("courierId");
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

exports.findClientOrders = async (clientId, page) => {
  try {
    // const ITEMS_PER_PAGE = 10;
    // let totalItems;
    // const ordersCount = await Order.find().countDocuments();
    // totalItems = ordersCount;

    const orders = await Order.find({ clientId: clientId })
      .sort({
        createdAt: -1,
      });
    // data = {
    //   orders: orders,
    //   itemsPerPage: ITEMS_PER_PAGE,
    //   currentPage: page,
    //   hasNextPage: page * ITEMS_PER_PAGE < totalItems,
    //   nextPage: page + 1,
    //   hasPreviousPage: page > 1,
    //   previousPage: page - 1,
    //   lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    // };
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
    order.courierId = courier.courierId;
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
    if (
      order.payer === "sender" &&
      status === "received" &&
      order.paymentType === "cash"
    ) {
      order.paymentStatus = "paid";
    } else if (
      order.payer === "sender" &&
      status === "delivered" &&
      order.paymentType === "cash"
    ) {
      order.paymentStatus = "paid";
    }
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

exports.getOrdersByServiceType = async (serviceType) => {
  try {
    const orders = await Order.find({ orderType: orderType });
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getBusinessOrders = async (businessOwnerId, dateFrom, dateTo) => {
  try {
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const businessOwner = await Farm.findById(businessOwnerId);
    const orders = await Order.find(
      {
        serviceType: "food",
        orderItems: { $elemMatch: { farmName: businessOwner.farmName } },
        orderDate: { $gte: startDate, $lte: endDate },
      },
      {
        fromAddress: 1,
        toAddress: 1,
        senderName: 1,
        senderPhone: 1,
        receiverName: 1,
        receiverPhone: 1,
        deliveryPrice: 1,
        payer: 1,
        paymentStatus: 1,
        paymentType: 1,
        orderStatus: 1,
        orderDate: 1,
        orderItems: 1,
      }
    ).lean();
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getCouriersOrders = async (dateFrom, dateTo) => {
  try {
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const orders = await Order.find(
      {
        orderDate: { $gte: startDate, $lte: endDate },
      },
      {
        fromPoint: 0,
        toPoint: 0,
        clientId: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      }
    )
      .populate("courierId")
      .lean();
    return orders;
  } catch (err) {
    throw new Error(err);
  }
};
