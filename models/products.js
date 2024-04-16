const mongoose = require("mongoose");

const productModel = new mongoose.Schema({
  productname: {
    type: String,
  },
  productimage: {
    type: String,
  },
  productprice: {
    type: String,
  },
});
const product = mongoose.model("product", productModel);
module.exports = product;
