const mongoose = require("mongoose");

const cartModel = new mongoose.Schema({
  id: {
    type: String,
  },
  product: [
    {
      productname: {
        type: String,
      },
      productimage: {
        type: String,
      },
      productprice: {
        type: String,
      }
    }
  ]
});
const cart = mongoose.model("cart", cartModel);
module.exports = cart;
