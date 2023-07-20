// ** Reviews / Ratings / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');


const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        require: [true, 'Review can not be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: { // ?? Parent Referensing
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
},
{  // ** INI MEMBUAT VIRTUAL PROPERTIES
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

reviewSchema.pre(/^find/, function(next){

    // ?? INI CARA 1 MENGGANTIKAN path tour yang sudah diatur dengan virtual foreignKey di tourModel
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
});

// ** udemy 168. Calculating Average Rating on Tours based on reviews
reviewSchema.statics.calcAverageRatings = async function(tourId){   
     const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: {$avg: '$rating'}
            }
        }
    ]);
    console.log(stats, stats.length);     // OUTPUTNYA: [{ _id: new ObjectId("64a5794300012d4ea7e3e833"),  nRating: 3, avgRating: 4 }]

    await Tour.findByIdAndUpdate(tourId, {                      
        ratingsQuantity: stats.length>0 ? stats[0].nRating : 0,
        ratingsAverage: stats.length>0 ? stats[0].avgRating : 4.5
    });    
}

reviewSchema.post('save', function(){        // ?? Testing untuk nyoba Calculating Average Rating
    // * This points to current review          // ** jadi ketika ditambah reviewsnya, ratingsQuantity dan ratingsAverage akan berubah
    this.constructor.calcAverageRatings(this.tour); //  this.costructor itu untuk memanggil dirinya sendiri, kalau misalkan di tourController kan kudu dipanggil class Reviewnya 
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {      // ** INI UNTUK PERSIAPAN SEBELUM UPDATE/DELETE REVIEWS ratingsQuantity dan ratingsAverage  || jadi ketika di update atau di hapus reviewsnya, ratingsQuantity dan ratingsAverage akan berubah
    this.r = await this.clone().findOne();     
    next();
  });
  
reviewSchema.post(/^findOneAnd/, async function() {       // ** MASIH LANJUTAN ATAS, JIKA SUDAH MASUK DATABASE DATA YANG DIUPDATE TADI, MAKA AKAN MASUK calcAverageRatings
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });     // Cegah Duplicate reviews dari user yang sama dengan index

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

