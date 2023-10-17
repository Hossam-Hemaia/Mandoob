const axios = require("axios");
const geolib = require("geolib");
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

exports.getFarmsFoodPoint = async () => {
  try {
    const foodZone = await FoodZone.findOne();
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
    let senderId;
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
      senderId = response.data.senderid[0];
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
