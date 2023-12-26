const mongoose = require("mongoose");


const mongo_uri = "mongodb://localhost:27017/uploade";

exports.connect = () => {

  mongoose
    .connect(mongo_uri )
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.error("database connection failed"+error);
    });
};