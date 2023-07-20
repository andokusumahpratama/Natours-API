const Booking = require('./../models/bookingModel');
const Tour = require('./../models/tourModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async(req, res, next) => {
    // * 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId)
    console.log(req.user.email);

    // * 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
                        mode: 'payment',
                        payment_method_types: ['card'],
                        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, // ** CARA INI TIDAK AMAN, HARUS MENGGUNAKAN WEBHOOK
                        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
                        customer_email: req.user.email,
                        client_reference_id: req.params.tourId,
                        line_items: [
                            {                                
                                price_data: {
                                    currency: 'usd',
                                    unit_amount: tour.price * 100,
                                    product_data: {
                                      name: `${tour.name} Tour`,
                                      description: tour.summary,
                                      images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                                    },
                                  },
                                quantity: 1,
                                
                            }
                        ],                  
                    });

    // * 3) Creaet session as response
    res.status(200).json({
        status: 'success',
        session
    })
});

exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
    const {tour, user, price} = req.query;
    if(!tour && !user && !price) return next();

    await Booking.create({tour, user, price});

    res.redirect(req.originalUrl.split('?')[0]);    // ini datang dari address getCheckoutSession success_url:
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);