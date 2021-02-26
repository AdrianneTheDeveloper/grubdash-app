const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
// req.body Validation
function bodyIsValid(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (!name || name === "") {
    next({
      status: 400,
      message: "Dish must include a name",
    });
  } else if (!description || description === "") {
    next({
      status: 400,
      message: "Dish must include a description",
    });
  } else if (!price || price <= 0 || typeof price === "string") {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  } else if (!image_url || image_url === "") {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  } else {
    res.locals.body = req.body.data;

    return next();
  }
}
// CREATE
function create(req, res, next) {
  const body = res.locals.body;
  const { name, description, price, image_url } = body;
  const newId = nextId();
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// dish Validator
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const dishById = dishes.find((dish) => {
    return dish.id === dishId;
  });
  if (dishById) {
    res.locals.origDish = dishById;
    return next();
  } else if (!dishById) {
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`,
    });
  }
}

function checkDishId(req, res, next) {
  const dishId = req.params.dishId;
  if (
    req.body.data.id !== dishId &&
    req.body.data.id !== null &&
    req.body.data.id !== "" &&
    req.body.data.id !== undefined
  ) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${dishId}`,
    });
  }
  return next();
}

// READ
function read(req, res, next) {
  res.json({ data: res.locals.origDish });
}
// UPDATE
function update(req, res, next) {
  const body = res.locals.body;
  const origDish = res.locals.origDish;

  if (origDish.name !== body.name) {
    origDish.name = body.name;
  }
  if (origDish.description !== body.description) {
    origDish.description = body.description;
  }
  if (origDish.price !== body.price) {
    origDish.price = body.price;
  }
  if (origDish.image_url !== body.image_url) {
    origDish.image_url = body.image_url;
  }
  res.status(200).json({ data: origDish });
}
// LIST
function list(req, res, next) {
  res.status(200).json({ data: dishes });
}

module.exports = {
  create: [bodyIsValid, create],
  update: [bodyIsValid, dishExists, checkDishId, update],
  read: [dishExists, read],
  list,
};
