const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// ** CARA 1
// exports.getAllReviews = catchAsync(async(req, res, next) => {
//     let filter = {};
//     if(req.params.tourId) filter = { tour: req.params.tourId }  // Filter untuk mencari tourId jika tidak ada maka {} kosong. jika ada konsepnya mirip seperti GET SPESIFIK DATA TOUR || ini juga implementasi dari query mongoDB

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'Success',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     });
// });
// ** CARA 2
exports.getAllReviews = factory.getAll(Review);

// ** CARA 1
// exports.createReview = catchAsync(async(req, res, next) => {
//     // ** Allow Nested routes  (routesnya di atur di tourRoute)
//     if(!req.body.tour) req.body.tour = req.params.tourId;   // ** Ini case implementasi dalam nested routes
//     if(!req.body.user) req.body.user = req.user.id;         // ** Ini case implementasi dalam nested routes


//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'Success',        
//         data: {
//             newReview
//         }
//     });
// });
// ** CARA 2
exports.getReview = factory.getOne(Review);
exports.setTourUserIds = (req, res, next) => {  // ** CARA 2 DALAM CREATE DIBUAT TERPISAH SEBAGAI MIDDLEWARE
    if(!req.body.tour) req.body.tour = req.params.tourId;   // ** Ini case implementasi dalam nested routes
    if(!req.body.user) req.body.user = req.user.id;         // ** Ini case implementasi dalam nested routes
    next();
}
exports.createReview = factory.createOne(Review);       // ** CARA 2 DALAM CREATE
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);