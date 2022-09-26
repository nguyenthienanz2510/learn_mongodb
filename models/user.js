const mongodb = require("mongodb");
const getDb = require("../util/database").getDb;

class User {
  constructor(name, email, cart, id) {
    this.name = name;
    this.email = email;
    this.cart = cart;
    this._id = id;
  }

  save() {
    const db = getDb();
    return db.collection("users").insertOne(this);
  }

  addToCart(product) {
    const cartProductIndex = this.cart.items.findIndex((item) => {
      console.log(item.productId.toString() === product._id.toString())
      return item.productId.toString() === product._id.toString();
    });
    console.log(cartProductIndex)

    let newQuantity = 1;
    const updateCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updateCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updateCartItems.push({
        productId: new mongodb.ObjectId(product._id),
        quantity: newQuantity,
      });
    }

    const updateCart = {
      items: updateCartItems,
    };

    const db = getDb();
    return db.collection("users").updateOne(
      {
        _id: new mongodb.ObjectId(this._id),
      },
      { $set: { cart: updateCart } }
    );
  }

  static findById(userId) {
    const db = getDb();
    return db.collection("users").find({ _id: new mongodb.ObjectId(userId) });
  }
}

module.exports = User;
