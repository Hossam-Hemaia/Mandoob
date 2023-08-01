const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Client = require("../models/client");
const adminServices = require("../services/adminServices");
const courierServices = require("../services/courierServices");
const clientServices = require("../services/clientServices");
const utilities = require("../utils/utilities");

exports.postCreatAccount = async (req, res, next) => {
  const { clientName, phoneNumber, email, address, password } = req.body;
  try {
    const error = validationResult(req);
    if (!error.isEmpty() && error.array()[0].msg !== "Invalid value") {
      const errorMsg = new Error(error.array()[0].msg);
      errorMsg.statusCode = 422;
      throw errorMsg;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const client = new Client({
      clientName,
      phoneNumber,
      email,
      address,
      password: hashedPassword,
    });
    await client.save();
    res.status(201).json({ success: true, message: "Welcome aboard!" });
  } catch (err) {
    next(err);
  }
};

exports.postLogin = async (req, res, next) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty() && error.array()[0].msg !== "Invalid value") {
      const errorMsg = new Error(error.array()[0].msg);
      errorMsg.statusCode = 422;
      throw errorMsg;
    }
    const token = jwt.sign(
      {
        userId: req.client._id,
        role: req.client.role,
      },
      process.env.SECRET,
      { expiresIn: "1Day" }
    );
    res.status(200).json({
      success: true,
      token: token,
      user: req.client,
      message: "You logged in successfully!",
    });
  } catch (err) {
    next(err);
  }
};

exports.usersLogin = async (req, res, next) => {
  const { username, password, location } = req.body;
  try {
    const user = await adminServices.findUser(username);
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const error = new Error("Incorrect password!");
      error.statusCode = 422;
      throw error;
    }
    if (user.isActive === false) {
      const error = new Error("Username is suspended!");
      error.statusCode = 422;
      throw error;
    }
    let turn = 1;
    if (user.role === "courier") {
      const shift = await adminServices.getShift(user.workingShiftId);
      const inShift = utilities.checkShiftTime(
        shift.startingHour,
        shift.startingMinute,
        shift.endingHour,
        shift.endingMinute
      );
      if (!inShift) {
        const error = new Error("Wrong shift time!");
        error.statusCode = 403;
        throw error;
      }
      let courierData;
      const { hasLog, courierLog } = await courierServices.findCourierLog(
        user._id
      );
      if (hasLog) {
        courierData = {
          courierId: user._id,
          location,
          openDate: new Date(),
          courierActive: true,
          hasFridge: user.hasFridge,
        };
        await courierServices.updateCourierLog(courierData);
      } else {
        courierData = {
          courierId: user._id,
          username: user.username,
          courierName: user.courierName,
          location,
          openDate: new Date(),
          courierActive: true,
          hasFridge: user.hasFridge,
        };
        await courierServices.createCourierLog(courierData);
      }
      if (!courierLog || !courierLog.hasOrder) {
        const area = await adminServices.getArea(user.workingAreaId);
        const turnData = {
          zone: area.zoneName,
          areaId: area._id,
          courierId: user._id,
          username: user.username,
          courierName: user.courierName,
        };
        const inQueue = await courierServices.courierInQueue(user._id);
        if (!inQueue) {
          const courierTurn = await courierServices.createCourierTurn(turnData);
          const count = await courierServices.getCourierTurn(courierTurn);
          turn += count;
        }
      }
      const { hasTimeout } = await courierServices.findCourierTimeout(user._id);
      if (!hasTimeout) {
        await courierServices.setCourierTimeout(user._id);
      }
    }
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.SECRET,
      { expiresIn: "1Day" }
    );
    res.status(200).json({
      success: true,
      token: token,
      turn: turn,
      userId: user._id,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

exports.getVerifyToken = async (req, res, next) => {
  const token = req.query.token;
  let decodedToken;
  try {
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
  if (decodedToken.role === "admin") {
    const admin = await adminServices.getUserById(decodedToken.userId);
    if (!admin || admin.role !== "admin") {
      const error = new Error("Authorization faild!");
      error.statusCode = 401;
      next(error);
    }
    return res.status(200).json({
      success: true,
      decodedToken: decodedToken,
      admin,
    });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const courierId = req.body.courierId;
    const { courierLog } = await courierServices.findCourierLog(courierId);
    if (courierLog.hasOrder) {
      throw new Error("You still have unsubmitted order!");
    }
    const courierData = {
      courierId: courierId,
      courierActive: false,
    };
    await courierServices.updateCourierLog(courierData);
    await courierServices.deleteCourierTurn(courierId);
    res.status(200).json({ success: true, message: "Courier Logged out" });
  } catch (err) {
    next(err);
  }
};

exports.getVerifyPhoneNumber = async (req, res, next) => {
  try {
    const phoneNumber = req.query.phoneNumber;
    const client = await clientServices.findClientByPhoneNumber(phoneNumber);
    if (client) {
      res.status(200).json({ success: true, message: "Phone number exist" });
    }
  } catch (err) {
    next(err);
  }
};

exports.putResetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty() && errors.array()[0].msg !== "Invalid value") {
      const errorMsg = new Error(errors.array()[0].msg);
      errorMsg.statusCode = 422;
      throw errorMsg;
    }
    const { phoneNumber, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const clientData = { password: hashedPassword };
    const updated = await clientServices.updateClient(phoneNumber, clientData);
    if (!updated) {
      throw new Error("Update Failed!");
    }
    res.status(200).json({ success: true, message: "Update succeeded!" });
  } catch (err) {
    next(err);
  }
};

exports.deleteCourierAccount = async (req, res, next)=>{
  const courierId = req.query.courierId;
  
}