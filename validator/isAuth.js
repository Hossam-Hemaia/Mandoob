const jwt = require("jsonwebtoken");
const adminServices = require("../services/adminServices");
const clientServices = require("../services/clientServices");
const courierServices = require("../services/courierServices");

exports.clientIsAuth = async (req, res, next) => {
  let decodedToken;
  try {
    const token = req.get("Authorization").split(" ")[1];
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch (err) {
    err.statusCode = 403;
    next(err);
  }
  if (!decodedToken) {
    const error = new Error("Authorization faild!");
    error.statusCode = 401;
    next(error);
  }
  if (decodedToken.role !== "client") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  const client = await clientServices.findClient(decodedToken.userId);
  if (!client || client.role !== "client") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  req.clientId = decodedToken.userId;
  next();
};

exports.adminIsAuth = async (req, res, next) => {
  let decodedToken;
  try {
    const token = req.get("Authorization").split(" ")[1];
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch (err) {
    err.statusCode = 403;
    next(err);
  }
  if (!decodedToken) {
    const error = new Error("Authorization faild!");
    error.statusCode = 401;
    next(error);
  }
  if (decodedToken.role !== "admin") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  const admin = await adminServices.getUserById(decodedToken.userId);
  if (!admin || admin.role !== "admin") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  req.adminId = admin._id;
  next();
};

exports.courierIsAuth = async (req, res, next) => {
  let decodedToken;
  try {
    const token = req.get("Authorization").split(" ")[1];
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch (err) {
    err.statusCode = 403;
    next(err);
  }
  if (!decodedToken) {
    const error = new Error("Authorization faild!");
    error.statusCode = 401;
    next(error);
  }
  if (decodedToken.role !== "courier") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  const courier = await courierServices.findCourier(decodedToken.userId);
  if (!courier || courier.role !== "courier") {
    const error = new Error("Forbidden!");
    error.statusCode = 401;
    next(error);
  }
  req.courierId = courier._id;
  next();
};

exports.farmerIsAuth = async (req, res, next) => {
  let decodedToken;
  try {
    const token = req.get("Authorization").split(" ")[1];
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch (err) {
    err.statusCode = 403;
    next(err);
  }
  if (!decodedToken) {
    const error = new Error("Authorization faild!");
    error.statusCode = 401;
    next(error);
  }
  if (decodedToken.role !== "farmer") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  const farmer = await adminServices.getUserById(decodedToken.userId);
  if (!farmer || farmer.role !== "farmer") {
    const error = new Error("Authorization faild!");
    error.statusCode = 403;
    next(error);
  }
  req.farmerId = decodedToken.userId;
  next();
};
