const express = require('express');
const app = express();
const path =  require('path');
const morgan =  require('morgan');
const nocache = require('nocache')
const session = require('express-session')
const mongoose = require('mongoose')
const Razorpay = require('razorpay');
require('dotenv').config();


const PORT = process.env.PORT ;
app.use(morgan('dev'));
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.set('view engine','ejs')

const oneday = 1000 * 60 * 60 * 24;
app.use(nocache());
app.use(
    session({
        secret : 'Your-secret-key',
        resave: false,
        cookie: {maxAge: oneday},
        saveUninitialized: true,
}))


const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
  });


// connecting MongoDb
mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("Mongodb is connected")
}).catch(()=>{
    console.log("Mongodb is not connected")
})


// requiring routes
const userrouter = require('./routes/user')
const adminrouter = require('./routes/admin')
const collection = require('./models/mongodb')


//load assets
app.use('/js',express.static(path.resolve(__dirname,'public/js')))
app.use('/css',express.static(path.resolve(__dirname,'public/css')))
app.use('/img',express.static(path.resolve(__dirname,'public/img')))
app.use('/uploads',express.static(path.resolve(__dirname,'uploads')))


//setup router
app.use('/',userrouter)
app.use('/admin',adminrouter)

// Error handling middleware

// app.use((req, res, next) => {
//   next(createError(404)); // Forward to the error handler
// });

// app.use((err, req, res, next) => {
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//   res.status(err.status || 500);
//   res.render('error/error');
// });

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`);
})