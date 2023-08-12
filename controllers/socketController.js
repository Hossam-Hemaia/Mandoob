const rdsClient = require("../config/redisConnect");
const adminServices = require("../services/adminServices");
const orderServices = require("../services/orderServices");
const courierServices = require("../services/courierServices");
const utilities = require("../utils/utilities");

exports.updateSocket = async (socket) => {
  try {
    const cacheDB = rdsClient.getRedisConnection();
    socket.on("update_socket", async (event) => {
      const username = event.username;
      await cacheDB.hSet(`${username}-s`, "socket", JSON.stringify(socket.id));
    });
  } catch (err) {
    console.log(err);
  }
};

exports.assigneOrder = async (socket) => {
  try {
    socket.on("assign_order", async (event) => {
      console.log("assigning to courier");
      const { orderId, courierId } = event;
      const order = await orderServices.findOrder(orderId);
      const needFridge = order.vehicleType === "car" ? false : true;
      const courier = await courierServices.findCourier(courierId);
      if (needFridge && !courier.hasFridge) {
        throw new Error("Courier car does not comply with order requirements!");
      }
      await courierServices.sendOrder(
        courier.username,
        order,
        courierId,
        courier.workingAreaId
      );
    });
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierAccepted = async (socket) => {
  try {
    socket.on("courier_accepted", async (event) => {
      const io = require("../socket").getIo();
      const { courierId, orderId } = event;
      console.log("courier accepted..", courierId, orderId);
      const courier = await courierServices.assignCourier(courierId);
      const order = await orderServices.assignOrder(orderId, courier);
      await courierServices.deleteCourierTurn(courierId);
      io.emit("courier_assigned", { orderId: orderId });
    });
  } catch (err) {
    console.log(err);
  }
};

exports.courierDeclined = async (socket) => {
  try {
    socket.on("courier_declined", async (event) => {
      const io = require("../socket").getIo();
      const { courierId, orderId, reason } = event;
      // const courier = await courierServices.findCourier(courierId);
      // const order = await orderServices.findOrder(orderId);
      await courierServices.setCourierBusyStatus(courierId, true);
      await courierServices.courierRejection(courierId, orderId, reason);
      await courierServices.deleteCourierTurn(courierId);
      io.emit("courier_refused", {
        orderId: orderId,
        message: "Courier refused to receive the order",
      });
      // const nextCourier = await clientServices.findCourier(
      //   courier.workingAreaId
      // );
      // if (!nextCourier) {
      //   await cacheDB.lPush(
      //     `${courier.workingAreaId}`,
      //     JSON.stringify(orderId)
      //   );
      //   return;
      // }
      // const io = require("../socket").getIo();
      // const courierSocket = await utilities.getSocketId(nextCourier.username);
      // io.to(courierSocket).emit("order_assigned", order);
      // setTimeout(async () => {
      //   console.log("transfering order...");
      //   await orderServices.checkAcceptingOrder(
      //     courier.workingAreaId,
      //     orderId,
      //     courierSocket
      //   );
      // }, 60000);
    });
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierApology = async (socket) => {
  socket.on("courier_apology", async (event) => {
    const io = require("../socket").getIo();
    const { courierId, orderId, reason } = event;
    await courierServices.courierRejection(courierId, orderId, reason);
    io.emit("courier_refused", {
      orderId: orderId,
      message: "Courier refused to receive the order",
    });
  });
};

exports.courierReceivedOrder = async (socket) => {
  try {
    socket.on("order_received", async (event) => {
      const orderId = event.orderId;
      await orderServices.updateOrderStatus(orderId, "received");
    });
    socket.emit("order_in_hand", { message: "You have an order to deliver" });
  } catch (err) {
    console.log(err);
  }
};

exports.courierCurrentLocation = async (socket) => {
  try {
    socket.on("current_point", async (event) => {
      const { orderId, courierId, flag, location } = event;
      if (flag === "vacant") {
        const courier = await courierServices.findCourier(courierId);
        console.log(`courier ${courier.username} vacant`);
        const courierData = {
          location,
          courier,
          areaId: courier.workingAreaId,
        };
        await courierServices.updateCourierLocation(courierData);
        const courierInArea = await utilities.courierInArea(courierData);
        if (courierInArea) {
          const { courierLog } = await courierServices.findCourierLog(
            courierId
          );
          if (!courierLog.isBusy) {
            const order = await orderServices.getOrderFromQueue(
              courier.workingAreaId
            );
            if (order) {
              const needFridge = order.vehicleType === "car" ? false : true;
              if (needFridge && courierLog.hasFridge) {
                await courierServices.sendOrder(
                  courier.username,
                  order,
                  courier._id,
                  courier.workingAreaId
                );
              } else if (!needFridge) {
                await courierServices.sendOrder(
                  courier.username,
                  order,
                  courier._id,
                  courier.workingAreaId
                );
              } else {
                await orderServices.pushOrderToQueue(
                  courier.workingAreaId,
                  order._id
                );
              }
            }
          }
          const courierTurn = await courierServices.findCourierTurn(
            courier.username
          );
          if (!courierTurn) {
            const area = await adminServices.getArea(courier.workingAreaId);
            const turnData = {
              zone: area.zoneName,
              areaId: area._id,
              courierId: courier._id,
              username: courier.username,
              courierName: courier.courierName,
            };
            await courierServices.createCourierTurn(turnData);
          }
        } else {
          await courierServices.deleteCourierTurn(courierId);
        }
        socket.emit("courier_vacant", { courierId: courierId, flag: flag });
      } else if (flag === "picking up") {
        console.log("Picking up order");
        socket.emit("picking_up", { courierId: courierId, flag: flag });
      } else if (flag === "delivering") {
        console.log("going to receiver");
        socket.emit("delivering_order", { courierId: courierId, flag: flag });
      }
    });
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierDeliveredOrder = async (socket) => {
  try {
    socket.on("order_finish", async (event) => {
      console.log("order delivered");
      const { orderId, courierId, status } = event;
      await orderServices.updateOrderStatus(orderId, status);
      if (status === "delivered") {
        await courierServices.setCourierOrderStatus(courierId, false);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

exports.updateCourierCache = async (socket) => {
  try {
    const cacheDB = await rdsClient.getRedisConnection();
    socket.on("update_cache", async (event) => {
      const courierId = event.courierId;
      await cacheDB.hSet(
        `${courierId}-c`,
        "cache",
        JSON.stringify(event.courierCache)
      );
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getCourierCache = async (socket) => {
  try {
    socket.on("get_courier_cache", async (event) => {
      const courierCache = await utilities.getCourierCache(event.courierId);
      socket.emit("courier_cache", courierCache);
    });
  } catch (err) {
    console.log(err);
  }
};

exports.deleteCourierCache = async (socket) => {
  try {
    const cacheDB = await rdsClient.getRedisConnection();
    socket.on("delete_courier_cache", async (event) => {
      await cacheDB.del(`${event.courierId}-c`);
    });
  } catch (err) {
    console.log(err);
  }
};

exports.sendCouriersLocations = async () => {
  try {
    console.log("sending locations...");
    const couriersLocations = await courierServices.getCouriersLogs();
    const io = require("../socket").getIo();
    io.emit("couriers_locations", { locations: couriersLocations });
  } catch (err) {
    throw new Error(err);
  }
};
