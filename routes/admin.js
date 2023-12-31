const express = require("express");
const adminController = require("../controllers/adminController");
const isAuth = require("../validator/isAuth");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const limiter = rateLimit({ windowMs: 30 * 60 * 1000, max: 10 });
/*************************************
 * USERS ROUTES
 *************************************/
router.post("/create/user", isAuth.adminIsAuth, adminController.postCreateUser);

router.get("/all/users", isAuth.adminIsAuth, adminController.getAllUsers);

router.get("/get/user", isAuth.adminIsAuth, adminController.getUser);

router.put("/edit/user", isAuth.adminIsAuth, adminController.putEditUser);

router.delete("/delete/user", isAuth.adminIsAuth, adminController.deleteUser);
/*************************************
 * COURIERS ROUTES
 *************************************/
router.post(
  "/create/courier",
  isAuth.adminIsAuth,
  adminController.postCreateCourier
);

router.get("/all/couriers", isAuth.adminIsAuth, adminController.getAllCouriers);

router.get("/get/courier", isAuth.adminIsAuth, adminController.getCourier);

router.put("/edit/courier", isAuth.adminIsAuth, adminController.puteditCourier);

router.delete(
  "/delete/courier",
  isAuth.adminIsAuth,
  adminController.deleteCourier
);

router.post(
  "/extend/courier/shift",
  isAuth.adminIsAuth,
  adminController.postExtendCourierShift
);

router.put(
  "/set/busy/status",
  isAuth.adminIsAuth,
  adminController.putCourierBusyStatus
);

router.get(
  "/courier/orders",
  isAuth.adminIsAuth,
  adminController.getCourierOrders
);

router.get(
  "/available/couriers",
  isAuth.adminIsAuth,
  adminController.getAvailableCouriers
);
/*************************************
 * AREAS ROUTES
 *************************************/
router.post("/create/area", isAuth.adminIsAuth, adminController.postCreateArea);

router.get("/get/areas", isAuth.adminIsAuth, adminController.getAreas);

router.get("/get/area", isAuth.adminIsAuth, adminController.getArea);

router.delete("/delete/area", isAuth.adminIsAuth, adminController.deleteArea);

router.get(
  "/cached/areas",
  isAuth.adminIsAuth,
  adminController.getAdjustedAreas
);
/*************************************
 * SHIFTS ROUTES
 *************************************/
router.post(
  "/create/shift",
  isAuth.adminIsAuth,
  adminController.postCreateShift
);

router.get("/get/all/shifts", isAuth.adminIsAuth, adminController.getAllShifts);

router.get("/get/shift", isAuth.adminIsAuth, adminController.getShift);

router.put("/edit/shift", isAuth.adminIsAuth, adminController.editShift);

router.delete("/delete/shift", isAuth.adminIsAuth, adminController.deleteShift);
/*************************************
 * ORDERS ROUTES
 *************************************/
router.get("/all/orders", isAuth.adminIsAuth, adminController.getAllOrders);

router.get(
  "/service/type/orders",
  isAuth.adminIsAuth,
  adminController.getOrdersByServiceType
);

router.get("/order", isAuth.adminIsAuth, adminController.getOrder);

router.put("/edit/order", isAuth.adminIsAuth, adminController.putEditOrder);

router.delete("/delete/order", isAuth.adminIsAuth, adminController.deleteOrder);

router.get(
  "/queued/orders",
  isAuth.adminIsAuth,
  adminController.getQueuedOrders
);
/*************************************
 * GENERAL PRICING ROUTES
 *************************************/
router.post("/set/pricing", isAuth.adminIsAuth, adminController.postSetPricing);

router.get("/get/pricing", adminController.getPrices);

router.get("/prices/list", isAuth.adminIsAuth, adminController.getPricesList);
/*************************************
 * FOOD ZONE ROUTES
 *************************************/
router.post(
  "/create/food/zone",
  isAuth.adminIsAuth,
  adminController.createFoodZone
);

router.get("/food/zones", isAuth.adminIsAuth, adminController.getFoodZones);

router.delete(
  "/delete/food/zone",
  isAuth.adminIsAuth,
  adminController.deleteFoodZone
);
/*************************************
 * FARMS/SHOPS ROUTES
 *************************************/
router.post("/create/farm", isAuth.adminIsAuth, adminController.postCreateFarm);

router.get(
  "/admin/farms",
  isAuth.adminIsAuth,
  adminController.getAllBusinessFirms
);

router.get("/farm/detail", isAuth.adminIsAuth, adminController.getFarm);

router.delete("/delete/farm", isAuth.adminIsAuth, adminController.deleteFarm);
/*************************************
 * FARMS/SHOPS ITEMS ROUTES
 *************************************/
router.post(
  "/create/farm/item",
  isAuth.adminIsAuth,
  adminController.postCreateFarmItem
);

router.get("/farms/items", isAuth.adminIsAuth, adminController.getFarmItems);

router.get("/get/item", isAuth.adminIsAuth, adminController.getItem);

router.put(
  "/edit/farm/item",
  isAuth.adminIsAuth,
  adminController.putEditFarmItem
);

router.delete("/delete/item", isAuth.adminIsAuth, adminController.deleteItem);

router.get(
  "/farmer/items",
  isAuth.farmerIsAuth,
  adminController.getFarmerItems
);

router.get("/get/farmer/item", isAuth.farmerIsAuth, adminController.getItem);

router.post(
  "/create/farmer/item",
  isAuth.farmerIsAuth,
  adminController.postCreateFarmItem
);

router.put(
  "/edit/farmer/item",
  isAuth.farmerIsAuth,
  adminController.putEditFarmItem
);

router.delete(
  "/delete/farmer/item",
  isAuth.farmerIsAuth,
  adminController.deleteItem
);
/*************************************
 * REPORTS ROUTES
 *************************************/
router.get(
  "/get/business/owners",
  isAuth.adminIsAuth,
  adminController.getAllBsinessOwners
);

router.get(
  "/reports/business/owners",
  isAuth.adminIsAuth,
  adminController.getBusinessOwnerSales
);

router.get(
  "/reports/couriers/orders",
  isAuth.adminIsAuth,
  adminController.getCouriersReport
);

router.get(
  "/user/couriers/orders",
  isAuth.supervisorIsAuth,
  adminController.getCouriersReport
);

router.get(
  "/business/owner/report",
  isAuth.farmerIsAuth,
  adminController.getBusinessOwnerSales
);

router.post(
  "/client/suggestion",
  limiter,
  adminController.postClientSuggestion
);

router.get("/suggestions", isAuth.adminIsAuth, adminController.getSuggestions);

module.exports = router;
