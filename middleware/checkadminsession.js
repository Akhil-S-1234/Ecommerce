

const checkadminsession = (req, res, next) => {
    // Check if session exists
    if (req.session && req.session.admin) {
        // Session exists, proceed to next middleware or route handler
        next();
    } else {
        // Session does not exist, redirect to login page
        res.redirect('/admin/login');
    }
};


module.exports = { checkadminsession };
