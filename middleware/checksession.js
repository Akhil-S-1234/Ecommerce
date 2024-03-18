

const checksession = (req, res, next) => {
    // Check if session exists
    if (req.session && req.session.user) {
        // Session exists, proceed to next middleware or route handler
        next();
    } else {
        // Session does not exist, redirect to login page
        res.redirect('/login');
    }
};


module.exports = { checksession };
