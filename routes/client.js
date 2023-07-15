const express = require("express");
const isAuth = require("../validator/isAuth");
const clientController = require("../controllers/clientController");
const router = express.Router();

router.get("/deliver/data", clientController.getDeliveryData);

router.post(
  "/create/order",
  isAuth.clientIsAuth,
  clientController.postCreateOrder
);

router.get(
  "/client/order",
  isAuth.clientIsAuth,
  clientController.getClientOrder
);

router.get(
  "/client/orders",
  isAuth.clientIsAuth,
  clientController.getClientOrders
);

module.exports = router;
