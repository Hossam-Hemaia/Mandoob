const express = require("express");
const bcrypt = require("bcryptjs");
const Client = require("../models/client");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const validator = require("../validator/inputValidator");
const isAuth = require("../validator/isAuth");

const router = express.Router();

router.post(
  "/register/client",
  [
    validator.validateName,
    validator.validatePhoneNumber.custom(async (value, { req }) => {
      if (req.url === "/register/client") {
        const client = await Client.findOne({ phoneNumber: value });
        if (client) {
          throw new Error("Phone number is allready registered!");
        }
      }
    }),
    validator.validatePassword.custom(async (value, { req }) => {
      if (req.url === "/register/client") {
        if (value !== req.body.confirmPassword) {
          throw new Error("password does not match!");
        }
      }
    }),
  ],
  authController.postCreatAccount
);

router.post(
  "/login",
  [
    validator.validatePhoneNumber,
    validator.validatePassword.custom(async (value, { req }) => {
      if (req.url === "/login") {
        const client = await Client.findOne({
          phoneNumber: req.body.phoneNumber,
        });
        const doMatch = await bcrypt.compare(value, client.password);
        if (!doMatch) {
          throw new Error("Invalid password!");
        } else {
          req.client = client;
        }
      }
    }),
  ],
  authController.postLogin
);

router.post("/user/login", authController.usersLogin);

router.get("/get/verify/token", authController.getVerifyToken);

router.post("/logout", authController.logout);

router.get("/verify/client/phone", authController.getVerifyPhoneNumber);

router.put(
  "/reset/password",
  [
    validator.validatePassword.custom(async (value, { req }) => {
      if (req.url === "/reset/password") {
        if (value !== req.body.confirmPassword) {
          throw new Error("password does not match!");
        }
      }
    }),
  ],
  authController.putResetPassword
);

// Removing courier account endpoint
router.delete(
  "/remove/courier/account",
  isAuth.courierIsAuth,
  adminController.deleteCourier
);

module.exports = router;
