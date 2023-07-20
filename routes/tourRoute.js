const express = require('express');
const tourController = require('./../controller/tourController');   // ? Cara 1
// const {getAllTours, createTour, getTour} = require('./../controller/tourController') //? Cara 2
const authController = require('./../controller/authController');
const reviewController = require('./../controller/reviewController');
const reviewRouter = require('./../routes/reviewRoute');


const router = express.Router();

//? ROUTES

router
    .route('/top-5-tour')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')  // ** /tours-within/233/center/-40,45/unit/mi || /tours-within?distance=233&center=-40,45&unit=mi
    .get(tourController.getToursWithin);
router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);
router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'), 
        tourController.uploadTourImage,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(authController.protect,authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);  


// ** nested routes
// POST /tour/234fde/reviews (review anak dari tour dan 234fde id dari tour)
// GET /tour/234fde/reviews (review anak dari tour dan 234fde id dari tour)
// GET /tour/234fde/reviews/4311de (review anak dari tour dan 234fde id dari tour, kemudian 4311de id dari reviews)
// ** CARA 1
// router
//     .route('/:tourId/reviews')
//     .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

// ** CARA 2 nested routes
router.use('/:tourId/reviews', reviewRouter);       // '/api/v1/tours/:tourId/reviews' ini main di filter = {} getAll

module.exports = router;