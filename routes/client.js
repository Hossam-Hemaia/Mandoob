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

router.delete(
  "/delete/client/account",
  isAuth.clientIsAuth,
  clientController.deleteClientAccount
);

router.get(
  "/food/zone/location",
  isAuth.clientIsAuth,
  clientController.getFoodZoneLocation
);

router.get(
  "/all/farms/items",
  isAuth.clientIsAuth,
  clientController.getFarmsItems
);

router.get(
  "/limited/farms/items",
  isAuth.clientIsAuth,
  clientController.getLimitedFarmsItems
);

router.get("/farms", isAuth.clientIsAuth, clientController.getAllFarms);

router.get("/farm/items", isAuth.clientIsAuth, clientController.getFarmItems);

module.exports = router;
