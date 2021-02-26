const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
// LIST
function list(req, res, next) {
  res.status(200).json({ data: orders });
}

// body Validation

function bodyIsValid(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  } else if (!mobileNumber || mobileNumber === "") {
    next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  } else if (!dishes) {
    next({
      status: 400,
      message: "Order must include a dish",
    });
  } else if (dishes.length === 0 || !Array.isArray(dishes)) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  } else if (dishes) {
    for (let i = 0; i < dishes.length; i++) {
      if (
        !dishes[i].quantity ||
        dishes[i].quantity <= 0 ||
        typeof dishes[i].quantity === "string"
      ) {
        next({
          status: 400,
          message: `Dish ${i} must have a quantity that is an integer greater than 0`,
        });
      }
    }
  }
  res.locals.body = req.body.data;
  return next();
}

// Validate order status for update
function updatingOrderStatus(req, res, next) {
  const acceptedStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    null,
    "",
  ];

  const {
    data: { status },
  } = req.body;

  if (!status || status === "") {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else if (!acceptedStatuses.includes(status)) {
    next({
      status: 400,
      message: `status ${status} is invalid`,
    });
  } else if (acceptedStatuses.includes(status)) {
    return next();
  }
}

// CREATE
function create(req, res, next) {
  const body = res.locals.body;
  const { deliverTo, mobileNumber, status, dishes } = body;
  const newId = nextId();
  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const  orderId  = req.params.orderId;

  const orderById = orders.find((order) => {
    return order.id === orderId;
  });
    if (orderById) {
      //console.log(true, orderById)
    res.locals.origOrder = orderById;
    return next();
  } else  {
    next({
      status: 404,
      message: `Order does not exist: ${orderId}.`,
    });
  }
}

function checkOrderId(req, res, next) {
    const  orderId  = req.params.orderId;

    if (
        req.body.data.id !== orderId &&
        req.body.data.id !== null &&
        req.body.data.id !== "" &&
        req.body.data.id !== undefined
    ) {
        
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${orderId}`,
          });
    } 
    return next();
}

// UPDATE
function update(req, res, next) {
  const body = res.locals.body;
  const origOrder = res.locals.origOrder;

  if (origOrder.deliverTo !== body.deliverTo) {
    origOrder.deliverTo = body.deliverTo;
  }
  if (origOrder.mobileNumber !== body.mobileNumber) {
    origOrder.mobileNumber = body.mobileNumber;
  }
  if (origOrder.status !== body.status) {
    origOrder.status = body.status;
  }
  if (origOrder.dishes !== body.dishes) {
    for (let i = 0; i < origOrder.dishes.length; i++) {
      for (let j = 0; j < body.dishes.length; j++) {
        origOrder.dishes[i].id = body.dishes[j].id;
        origOrder.dishes[i].description = body.dishes[j].description;
        origOrder.dishes[i].image_url = body.dishes[j].image_url;
        origOrder.dishes[i].price = body.dishes[j].price;
        origOrder.dishes[i].quantity = body.dishes[j].quantity;
      }
    }
  }

  res.status(200).json({ data: origOrder });
}
// READ
function read(req, res, next) {
  res.status(200).json({ data: res.locals.origOrder });
}
// Check status for delete handler
function checkStatusForDelete(req, res, next) {
  const order = res.locals.origOrder;

  if (order.status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  } else {
    return next();
  }
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const findOrderById = orders.findIndex((order) => {
    order.id === orderId;
  });
  orders.splice(findOrderById, 1);
  res.sendStatus(204);
}
module.exports = {
  list,
  create: [bodyIsValid, create],
  read: [orderExists, read],
  update: [orderExists, bodyIsValid,  updatingOrderStatus, checkOrderId, update],
  destroy: [orderExists, checkStatusForDelete, destroy],
};
