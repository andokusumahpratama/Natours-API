const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');   // ** ERROR HANDLING
const globalErrorHandling = require('./controller/errorController'); // ** ERROR HANDLING 

const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute');
const viewRouter = require('./routes/viewRoute');
const bookingRouter = require('./routes/bookingRoute');

const app = express();

app.set('view engine', 'pug');  // Ini untuk menjalankan pug
app.set('views', path.join(__dirname, 'views'));    // Ini direktorinya

// ** Serving static files
// app.use(express.static(`${__dirname}/public`));    // ** CARA 1 Static Files
app.use(express.static(path.join(__dirname, 'public')));    // ** CARA 2 Static Files


//? 1) GLOBAL MIDDLEWARE
// ** set Security HTTP Headers
// app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
 
        ],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// ** Developemnt logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// ** Limit request from same API -->> LIHAT DI HEADER
const limitter = rateLimit({
    max: 100, 
    windowMs: 60 * 60 * 1000,    // 60 menit, 60 detik, 1000 milidetik
    message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api',limitter);

// ** Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // ?? INI UNTUK MENERIMA FORM INPUTAN POST DARI BROWSER.
app.use(cookieParser());  // Untuk melihat cookie


// ** Data sanitization againts noSQL query injection
app.use(mongoSanitize());


// ** Data sanitization againts XSS 
app.use(xss());


// ** Prevent parameter solution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));


app.use((req, res, next) => {
    next();
});
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    // console.log(req.headers.cookie);
    next();
});

//? 3) ROUTES

// ?===== PINDAH KE viewROUTE========
// app.get('/', (req, res) =>{
//     res.status(200).render('base', {
//         tour: 'The Forest Hiker',
//         user: 'Ando Kusumah'
//     }); // base ini dari views/base.pug 
// });
// app.get('/overview', (req, res) => {
//     res.status(200).render('overview', {
//         title: 'All Tours'
//     });
// });
// app.get('/tour', (req, res) => {
//     res.status(200).render('tour', {
//         title: 'The Forest Hiker Tour'
//     });
// });
// ?===== PINDAH KE viewROUTE========

app.use('/', viewRouter);    // <-- Ini middleware untuk viewRoute
app.use('/api/v1/tours', tourRouter);    // <-- Ini middleware untuk tours
app.use('/api/v1/users', userRouter);    // <-- Ini middleware untuk users
app.use('/api/v1/reviews', reviewRouter);    // <-- Ini middleware untuk reviews
app.use('/api/v1/bookings', bookingRouter);    // <-- Ini middleware untuk booking

// ? Handling UnHandled Routes
app.all('*', (req, res, next) => {
    // ** CARA 1 TANPA HANDLING ERROR GLOBAL
    // res.status(404).json({
    //     status: 'Fail',
    //     message: `Can't find ${req.originalUrl} on this server`
    // });

    // ** CARA 2 ini dibuat error handling global
    // const err = new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status = 'Fail';
    // err.statusCode = 404;

    // next(err);
    
    // ** CARA 3 MENGGUNAKAN Utils AppError cuman tetap make GLOBAL HANDLING ERROR MIDDLEWARE
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ? ====GLOBAL HANDLING ERROR MIDDLEWARE====
app.use(globalErrorHandling);

//? 4) START SERVER
module.exports = app;