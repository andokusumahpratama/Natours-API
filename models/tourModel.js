const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator'); // npm i validator https://github.com/validatorjs/validator.js/
// const User = require('./userModel');

// ? Membuat Schema Untuk Tour
const tourSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: [true, 'A tour must have a name'],
        unique: true,
        maxlength: [50, 'A tour name must have less or equal then 50 character'],
        minlength: [10, 'A tour name must have less or equal then 40 character'],
        // validate: [validator.isAlpha, 'Tour name is only contain character']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a durations']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
        type: Number, 
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val*10)/10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
        type: Number, 
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: function(val){
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below regular price'
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // Untuk menyembunyikan createdAt pada tampilan
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    
    startLocation: {    // Embedding 
      // GeoJSON
      type:{
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String   
    },
    locations: [   // Embedding
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array, //?? Ini menggunakan Embedding Referensing terkait guides
    guides: [     // ?? Child Referensing
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]    
}, {  // ** INI MEMBUAT VIRTUAL PROPERTIES
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});
// ? Membuat Virtual Properties, Virtual properties berguna ketika Anda ingin mendapatkan atau mengubah nilai yang terkait dengan model atau dokumen, tetapi tidak ingin menyimpan nilai tersebut secara fisik dalam basis data.
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7;
});
// ? Virtual Populate
tourSchema.virtual('reviews', { // ?? Jadi ini untuk melihat review misalkan tour A ada review apa aja (ibarat ini _id tourModel foreign key ke reviewModel)
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
// ** GEO
tourSchema.index({ startLocation: '2dsphere' });

// ? Membuat Document Middleware: run before .save() and .create() // di tampilkan sebelum di simpan
tourSchema.pre('save', function(next) {
  // console.log(this); // Menampilkan document body
  this.slug = slugify(this.name, {lower: true});
  next();
});

// tourSchema.pre('save', async function(next){   //?? Ini menggunakan Embedding Referensing terkait guides
//   const guidesPromises = this.guides.map(async id => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

tourSchema.pre('save', function(next) {
  console.log(`Will save document..`); // Menampilkan document body
  next();
});
tourSchema.post('save', function(doc, next) {
  // console.log(doc); // Menampilkan document body
  next();
});

// ? QUERY MIDDLEWARE SEHINGGA KETIKA getAllTour, hanya secretTour yang false yang ditampilkan ne = not equals
tourSchema.pre(/^find/, function(next) { // ? ini untuk kata yang didepan dan dipelakang yang mengandung find
// tourSchema.pre('find', function(next) {
  this.find({ secretTour: {$ne: true} })
  this.start = Date.now();
  next()
});

tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${Date.now() - this.start} Milliseconds`);
  next()
});

tourSchema.pre(/^find/, function(next){
  this.populate({         // ** populate(guides) untuk menampilkan referensi dari id users
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// ? AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next){
//   this.pipeline().unshift({ $match: { secretTour: {$ne: true} } })
//   console.log(this.pipeline());
//   next();
// });

// ? Membuat Collection/Model Tour
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;