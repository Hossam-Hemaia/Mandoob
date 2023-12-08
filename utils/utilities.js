const path = require("path");
const axios = require("axios");
const geolib = require("geolib");
const Exceljs = require("exceljs");
const Area = require("../models/area");
const rdsClient = require("../config/redisConnect");
const FoodZone = require("../models/foodZone");

exports.getDeliveryRoute = async (locations, instructions) => {
  const response = await axios.post(
    `https://graphhopper.com/api/1/route?key=${process.env.gh_api_key}`,
    {
      points: [
        [locations.fromPoint.lng, locations.fromPoint.lat],
        [locations.toPoint.lng, locations.toPoint.lat],
      ],
      details: ["road_class", "surface"],
      vehicle: "car",
      locale: "en",
      instructions: instructions,
      calc_points: true,
      points_encoded: false,
    }
  );
  const data = await response.data;
  return data;
};

exports.getFarmsFoodPoint = async (zoneId) => {
  try {
    const foodZone = await FoodZone.findById(zoneId);
    return foodZone.location;
  } catch (err) {
    throw new Error(err);
  }
};

exports.checkShiftTime = (
  startingHour,
  startingMinute,
  endingHour,
  endingMinute
) => {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMinute = currentDate.getMinutes();
  if (
    currentHour >= startingHour &&
    currentHour <= endingHour &&
    currentMinute >= startingMinute &&
    currentMinute <= endingMinute
  ) {
    return true;
  } else {
    return false;
  }
};

exports.adjustAreasPolygons = async () => {
  const cacheDB = rdsClient.getRedisConnection();
  const areas = await Area.find();
  const zonesData = [];
  for (let area of areas) {
    let polygonInfo = {};
    let polygon = [];
    polygonInfo.areaName = area.areaName;
    polygonInfo.zoneName = area.zoneName;
    polygonInfo.areaId = area._id;
    for (let coords of area.areaPolygon.coordinates[0]) {
      let point = {};
      point.latitude = coords[1];
      point.longitude = coords[0];
      polygon.push(point);
    }
    polygonInfo.polygon = polygon;
    zonesData.push(polygonInfo);
  }
  await cacheDB.hSet("GEOMETRY", "areas", JSON.stringify(zonesData));
  console.log("Updating polygons...");
};

exports.findArea = async (point) => {
  try {
    const cacheDB = rdsClient.getRedisConnection();
    const areasData = await cacheDB.hGetAll("GEOMETRY");
    const areas = JSON.parse(areasData.areas);
    let result;
    for (let area of areas) {
      let inArea = geolib.isPointInPolygon(
        { latitude: point.lat, longitude: point.lng },
        area.polygon
      );
      if (inArea) {
        result = area;
        break;
      }
    }
    return result;
  } catch (err) {
    throw new Error(err);
  }
};

exports.getSocketId = async (username) => {
  try {
    const cacheDB = rdsClient.getRedisConnection();
    const user = await cacheDB.hGetAll(`${username}-s`);
    const socketId = JSON.parse(user.socket);
    return socketId;
  } catch (err) {
    throw new Error(err);
  }
};

exports.courierInArea = async (courierData) => {
  try {
    const area = await Area.findById(courierData.areaId);
    let polygon = [];
    for (let coords of area.areaPolygon.coordinates[0]) {
      let point = {};
      point.latitude = coords[1];
      point.longitude = coords[0];
      polygon.push(point);
    }
    let inArea = geolib.isPointInPolygon(
      {
        latitude: courierData.location.lat,
        longitude: courierData.location.lng,
      },
      polygon
    );
    if (inArea) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error(err);
  }
};

exports.getLocalDate = (date) => {
  const newDate = new Date(date);
  const localDate = new Date(
    newDate.getTime() - newDate.getTimezoneOffset() * 60000
  );
  return localDate;
};

exports.getEndOfDate = (date) => {
  const newDate = new Date(date);
  const localDate = new Date(
    newDate.getTime() - newDate.getTimezoneOffset() * 60000
  );
  return localDate.setHours(23, 59, 0, 0);
};

exports.getCourierCache = async (courierId) => {
  try {
    const cacheDB = await rdsClient.getRedisConnection();
    const courier = await cacheDB.hGetAll(`${courierId}-c`);
    const courierCache = JSON.parse(courier.cache);
    return courierCache;
  } catch (err) {
    console.log(err);
  }
};

exports.sendSms = async (phoneNumber, code) => {
  try {
    let senderId = process.env.sms_senderId;
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const senderIdData = {
      username: process.env.sms_api_username,
      password: process.env.sms_api_password,
    };
    const senderIdUrl = "https://www.kwtsms.com/API/senderid/";
    const response = await axios.post(senderIdUrl, senderIdData, config);
    if (response.data.result === "OK") {
      senderId = process.env.sms_senderId; //response.data.senderid[0];
    }
    const messageData = {
      username: process.env.sms_api_username,
      password: process.env.sms_api_password,
      sender: senderId,
      test: process.env.sms_live,
      mobile: phoneNumber,
      lang: "1",
      message: "MANDOOB: Your Code Is: " + code,
    };
    const sendSmsUrl = "https://www.kwtsms.com/API/send/";
    const smsResponse = await axios.post(sendSmsUrl, messageData, config);
    return smsResponse.data;
  } catch (err) {
    throw new Error(err);
  }
};

exports.createBusinessOwnerReport = async (orders) => {
  try {
    const fileName = `${Date.now()}-orders.xlsx`;
    const filePath = path.join("files", fileName);
    const workbook = new Exceljs.Workbook();
    const ordersData = [];
    for (let order of orders) {
      let orderArr = [];
      for (let key in order) {
        orderArr.push(order[key]);
      }
      ordersData.push(orderArr);
    }
    workbook.created = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;
    workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 1,
        visibility: "visible",
      },
    ];
    const sheet = workbook.addWorksheet("orders");
    sheet.addTable({
      name: "ordersTable",
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      columns: [
        {
          name: "order id",
        },
        {
          name: "from address",
        },
        {
          name: "to address",
        },
        {
          name: "sender name",
        },
        {
          name: "sender phone",
        },
        {
          name: "receiver name",
        },
        {
          name: "receiver phone",
        },
        {
          name: "delivery price",
        },
        {
          name: "payer",
        },
        {
          name: "payment status",
        },
        {
          name: "payment type",
        },
        {
          name: "order status",
        },
        {
          name: "order date",
        },
        {
          name: "order items",
        },
      ],
      rows: ordersData,
    });
    const ordersRows = sheet.getRows(1, orders.length + 1);
    ordersRows.forEach((row, rowIndex) => {
      row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
        cell.alignment = { horizontal: "center" };
      });
    });
    await workbook.xlsx.writeFile(filePath);
    return fileName;
  } catch (err) {
    throw new Error(err);
  }
};

exports.createCouriersOrdersReport = async (orders) => {
  try {
    const fileName = `${Date.now()}-couriers-orders.xlsx`;
    const filePath = path.join("files", fileName);
    const ordersData = [];
    for (let order of orders) {
      let orderArr = [];
      for (let key in order) {
        if (key === "courierId") {
          orderArr.push(order[key].courierName, order[key].username);
        } else {
          orderArr.push(order[key]);
        }
      }
      ordersData.push(orderArr);
    }
    const workbook = new Exceljs.Workbook();
    workbook.created = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;
    workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 1,
        visibility: "visible",
      },
    ];
    const sheet = workbook.addWorksheet("orders");
    sheet.addTable({
      name: "ordersTable",
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      columns: [
        {
          name: "order id",
        },
        {
          name: "from address",
        },
        {
          name: "to address",
        },
        {
          name: "parcel image",
        },
        {
          name: "attachments",
        },
        {
          name: "parcel name",
        },
        {
          name: "parcel type",
        },
        {
          name: "vehicle type",
        },
        {
          name: "sender name",
        },
        {
          name: "sender phone",
        },
        {
          name: "receiver name",
        },
        {
          name: "receiver phone",
        },
        {
          name: "delivery price",
        },
        {
          name: "payer",
        },
        {
          name: "payment status",
        },
        {
          name: "payment type",
        },
        {
          name: "order status",
        },
        {
          name: "service type",
        },
        {
          name: "order type",
        },
        {
          name: "order date",
        },
        {
          name: "order time",
        },
        {
          name: "company name",
        },
        {
          name: "business type",
        },
        {
          name: "order items",
        },
        {
          name: "notes",
        },
        {
          name: "courier name",
        },
        {
          name: "username",
        },
      ],
      rows: ordersData,
    });
    const ordersRows = sheet.getRows(1, orders.length + 1);
    ordersRows.forEach((row, rowIndex) => {
      row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
        if (cell) {
          cell.alignment = { horizontal: "center" };
        }
      });
    });
    await workbook.xlsx.writeFile(filePath);
    return fileName;
  } catch (err) {
    throw new Error(err);
  }
};
