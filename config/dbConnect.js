const mongoose = require("mongoose");

exports.connectDB = (connectionUrl) => {
  mongoose
    .set("strictQuery", false)
    .connect(connectionUrl)
    .then((result) => {
      console.log("connected to database...");
    })
    .catch((err) => {
      console.log(err);
    });
};
