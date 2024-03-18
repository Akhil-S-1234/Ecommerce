// middleware.js
const Category = require('../models/category'); // Import your Category model

const checkcateg = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.locals.categories = categories;
    console.log(categories);
    res.locals.issession = false
    if(req.session && req.session.user ){
      res.locals.issession = true
    }
    next();
  } catch (error) {
    console.error('Error fetching categories', error);
    res.locals.categories = []; // Set an empty array in case of an error
    next();
  }
};

module.exports = { checkcateg };
