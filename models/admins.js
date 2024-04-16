const mongoose = require("mongoose");

const adminModel = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
  },
});
const admin = mongoose.model("admin", adminModel);
module.exports = admin;
