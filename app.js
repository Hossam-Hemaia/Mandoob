const path = require("path");
const express = require("express");
const compression = require("compression");
const helemt = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors-express");
const dotenv = require("dotenv");
const multer = require("multer");
const cron = require("node-cron");

const connectDB = require("./config/dbConnect");
const rdsClient = require("./config/redisConnect");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const clientRouter = require("./routes/client");
const utilities = require("./utils/utilities");
const socketController = require("./controllers/socketController");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const options = {
  allow: {
    origin: "*",
    methods: "GET, POST, PUT, DELETE",
    headers: "Content-Type, Authorization, Cookie",
  },
  max: {
    age: null,
  },
};

dotenv.config();
const app = express();

const mongoDB_Uri = `${process.env.Production_DB_URI}`;

app.use(cors(options));
app.use(helemt());
app.use(express.json());
app.use(compression());
app.use(cookieParser());

app.use("/images", express.static(path.join(__dirname, "images")));
app.use(multer({ storage: fileStorage }).array("files"));

app.use(process.env.api, authRouter);
app.use(process.env.api, clientRouter);
app.use(process.env.api, adminRouter);

cron.schedule("0 0 * * *", async () => {
  await utilities.adjustAreasPolygons();
});

cron.schedule("*/1 * * * *", async () => {
  await socketController.sendCouriersLocations();
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ success: false, message: message });
});

connectDB.connectDB(mongoDB_Uri);
rdsClient.initRedis();

const server = app.listen(process.env.PORT, "localhost", () => {
  console.log(`listening on port ${process.env.PORT}`);
});

const io = require("./socket").initIo(server);
io.on("connection", (socket) => {
  console.log("New socket connected!");
  socketController.updateSocket(socket);
  socketController.assigneOrder(socket);
  socketController.courierAccepted(socket);
  socketController.courierDeclined(socket);
  socketController.courierReceivedOrder(socket);
  socketController.courierCurrentLocation(socket);
  socketController.courierDeliveredOrder(socket);
  socketController.updateCourierCache(socket);
  socketController.getCourierCache(socket);
  socketController.deleteCourierCache(socket);
  socketController.logout(socket);
});
