const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req,res,next) {
    res.json({data:dishes})
}

//checks for required data
function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({
          status: 400,
          message: `${propertyName}`
      });
    };
  }

//checks for price
function priceIsInteger(req,res,next) {
    const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
  }

//create new dish
function create (req,res,next) {
  const newId = nextId()
    const newDish = {...req.body.data, "id": `${newId}`
    }
    dishes.push(newDish);
    res.status(201).json({data: newDish})
}

//check if dish exists
function dishExists(req,res,next) {
    const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function read(req, res) {
    res.json({ data: res.locals.dish });
  }

function dishIdMatches (req,res,next) {
  const {dishId} = req.params;
  const {id} = req.body.data;
  if(id){
  if(id === dishId){
    next()
  } else {
     next({status:400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  })
  }
} else {
  next()
}
}

function update(req, res) {
    const {id} = req.body.data
    let dishId;
    id ? dishId = id : dishId = req.params.dishId
    const dish = req.body.data;
    const updatedDish = {
      ...dish
    }
    updatedDish.id = dishId
    res.json({ data: updatedDish});
}


module.exports = {
    list,
    create:[
            bodyDataHas("name"),
            bodyDataHas("description"),
            bodyDataHas("price"),
            bodyDataHas("image_url"),
            priceIsInteger,
            create
            ],
    read: [dishExists, read],
    update: [dishExists,
             dishIdMatches,
             bodyDataHas("name"),
             bodyDataHas("description"),
             bodyDataHas("price"),
             bodyDataHas("image_url"),
             priceIsInteger, 
             update
             ],
    dishExists,
    bodyDataHas,
    priceIsInteger
}