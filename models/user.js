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
      console.log(item.productId.toString() === product._id.toString());
      return item.productId.toString() === product._id.toString();
    });
    console.log(cartProductIndex);

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

  getCart() {
    const db = getDb();
    const productIds = this.cart.items.map((item) => {
      return item.productId;
    });
    return db
      .collection("products")
      .find({ _id: { $in: productIds } })
      .toArray()
      .then((products) => {
        return products.map((product) => {
          // console.log(product)
          return {
            ...product,
            quantity: this.cart.items.find((item) => {
              return item.productId.toString() === product._id.toString();
            }).quantity,
          };
        });
      });
  }

  deleteItemFromCart(productId) {
    const updateCartItems = this.cart.items.filter((item) => {
      return item.productId.toString() !== productId.toString();
    });
    const db = getDb();
    return db.collection("users").updateOne(
      {
        _id: new mongodb.ObjectId(this._id),
      },
      {
        $set: {
          cart: {
            items: updateCartItems,
          },
        },
      }
    );
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then((products) => {
        const order = {
          items: products,
          user: {
            _id: new mongodb.ObjectId(this._id),
            name: this.name,
          },
        };
        return db.collection("orders").insertOne(order);
      })
      .then((result) => {
        this.cart = { items: [] };
        return db.collection("users").updateOne(
          {
            _id: new mongodb.ObjectId(this._id),
          },
          {
            $set: {
              cart: {
                items: [],
              },
            },
          }
        );
      });
  }

  getOrders() {
    const db = getDb();
    return db.collection("orders").find({"user._id": new mongodb.ObjectId(this._id)}).toArray()
  }

  static findById(userId) {
    const db = getDb();
    return db.collection("users").find({ _id: new mongodb.ObjectId(userId) });
  }
}

module.exports = User;
