const user = require('../models/mongodb');

const checkblock = async (req, res, next) => {
  if(req.session.user){
  try {
    const userData = req.session.user;
    const User = await user.findOne({ _id: userData });

    if (User && User.isBlocked === true) {
      req.session.user = false
      
      return res.redirect('/login'); // Adjust the path to your login page
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
else{
  next()
}
};

module.exports = { checkblock };

  