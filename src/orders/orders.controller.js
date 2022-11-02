const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req,res,next) {
    res.json({data: orders})
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] && data[propertyName] !== "") {
        return next();
      }
      next({
          status: 400,
          message: `${propertyName}`
      })
    }
  }

//validate quantity
function validQty(req,res,next) {
  const {data : {dishes} = {} } = req.body;
  dishes.forEach((dish,index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity < 1 || Number(quantity) !== quantity) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`
      })
    }
  })
  next();
}

//Validates the dishes property
function validDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  console.log(dishes)
  if (Array.isArray(dishes) && dishes.length !== 0) {
    return next();
  } else {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
}
  
//create new order
function create (req,res,next) {
  const {data: {deliverTo, mobileNumber, dishes, status} ={} } = req.body
  const newId = nextId()
    const newOrder = {
      id: `${newId}`,
      deliverTo,
      mobileNumber,
      status,
    }
    orders.push(newOrder);
 
    res.status(201).json({data: newOrder})
}

//check if order exists
function orderExists(req,res,next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function orderIdMatches (req,res,next) {
  const {orderId} = req.params;
  const {data: {id} ={}} = req.body
  if(id){
    if(id === orderId){
      return next()
  } else {
     next({status:400, 
           message: `Order id does not match route id. Order: ${id},Route: ${orderId}`
  })
  }
} else {
  next()
}
}


function read(req, res, next) {
    res.json({ data: res.locals.order });
}

//update order
function update(req, res) {
  const foundOrder = res.locals.order;
  const {data:{deliverTo, mobileNumber, dishes} ={} } = req.body;
  
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  
  res.json({data:foundOrder})
}

//Verification for status property for a DELETE request
function isPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    return next();
  } else {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
}

//Verification for status and a PUT request
function validStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (!status || ( status !== "pending" && status !== "preparing" && status !== "out-for-delivery") ) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}


function destroy(req, res) {
  const {orderId} = req.params;
  const index = orders.find((order) => order.id === Number(orderId));
  orders.splice(index, 1);
  res.sendStatus(204);
}


module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    validDishes,
    validQty,
    create],
  read: [orderExists, read],
  update: [
    orderExists, 
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHas("status"),
    validDishes,
    validStatus,
    validQty,
    orderIdMatches, update],
  delete: [orderExists, isPending, destroy],
}