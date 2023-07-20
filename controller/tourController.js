const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');        // ?? Error Handling Global
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');   // Upload Image
const sharp = require('sharp');

// ? Middleware Aliasing
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

// ? Middleware Params -
exports.checkID = (req, res, next, val) => {
    if(req.params.id * 1 > tours.length){
        return res.status(404).json({
            status: 'Failed',
            message: 'Invalid ID'
        });
    }
    next();
}

//? chaining middleware -
exports.checkBody = (req, res, next) => {    
    if(!req.body.name || !req.body.price){        
        return res.status(400).json({
            status: 'fail',
            message: 'Missing name or price'
        });
    }
    next();
}

// ** MULTIPLE UPLOAD IMAGE
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
}
const upload = multer({     // ** Ini alamat untuk menyimpan foto dan filter
    storage: multerStorage,
    fileFilter: multerFilter
});
exports.uploadTourImage = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);
// upload.single('image'); // req.file
// upload.array('images', 5); // req.files
exports.resizeTourImages = catchAsync(async(req, res, next) => {
    if(!req.files.imageCover || !req.files.images) return next();   // Jika tidak ada images atau imageCover maka lewati

    // console.log(req.files);

    // * 1) Cover image
    const imageCoverFilename = `tour-${req.params.id}-${Date.now()}.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageCoverFilename}`);

    req.body.imageCover = imageCoverFilename;       // Ini untuk mengisi req.body.imageCover biar engga kosong pas saat dikirim ke updateOne
    
    // * 2) Images
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, i) => {       //** Kita gunakan map karena async untuk meloop gambar pada image
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

            await sharp(file.buffer)
                .resize(2000,1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);
            
            req.body.images.push(filename);
        })
    );

    next();
})


//? 2) ROUTE HANDLER
// ** CARA 1 GET ALL
// exports.getAllTours = catchAsync(async (req, res, next) => {    
//     try{
//         // ? Membuat Query
//         console.log(req.query); //? Untuk melihat data yg ada di url GET /api/v1/tours?duration=5&difficulty=easy
//         // EXECUTE QUERY        
//         const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate(); 
//         const tours = await features.query;

//         //? Send Response
//         res.status(200).json({
//             status: 'success',
//             time: req.requestTime,
//             // user: req.user, // ?? req.user ini dari authController.protect 
//             result: tours.length,
//             data: {
//                 tours
//             }
//         });
//     } catch(err){
//         return next(new AppError('Tour Not Found', 404), err);
//     }
    
// });
// ** CARA 2 
exports.getAllTours = factory.getAll(Tour);

// ** CARA 1 GET
// exports.getTour = catchAsync(async (req, res, next) => {        
//     try{
//         const tour = await Tour.findById(req.params.id).populate('reviews');         // req.params untuk melihat 127.0.0.1:8000/api/v1/tours/ //? 648d800df2ecb946dbe911b1 || await Tour.findById(req.params.id).populate(guides) untuk menampilkan referensi dari id users. cuman tidak diterapkan karena sudah di terapkan di tourModel this.populate || tetapi untuk yang .populate('reviews'); ini karena casenya hanya spesifik doang pada GetTour bukan yang dilain seperti GetAllTour

//         res.status(200).json({
//             status: 'success',
//             time: req.requestTime,
//             data: {
//                 tour
//             }
//         });
//     }catch(err){        
//         return next(new AppError('No Tour found with that id', 404, err));        
//     }
// });
// ** CARA 2 GET
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // * bisa juga menggunakan { path: 'reviews', select: 'name' }

// ** CARA 1 CREATE
// exports.createTour = catchAsync(async (req, res, next) => {
//     try{        
//         const newTour = await Tour.create(req.body); // ? req body untuk melihat body pada json

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour: newTour
//             }   
//         }); // Created Status
//     }catch(err){
//         // res.status(404).json({
//         //     status: 'Fail',
//         //     message: err 
//         // });
//         return next(new AppError('Tidak dapat membuat Tour', 404, err));
//     }
// });
// ** CARA 2
exports.createTour = factory.createOne(Tour);


// ** CARA 1 UPDATE
// exports.updateTour = catchAsync(async (req, res, next) => {    
//     try{        
//         const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//             new: true,
//             runValidators: true
//         });       
        
//         res.status(200).json({
//             status: 'success',
//             time: req.requestTime,
//             data: {
//                 tour
//             }
//         });        
//     }catch(err){        
//         return next(new AppError('Invalid data Send 🧨', 404, err));
//     }    
// });
// ** CARA 2 UPDATE
exports.updateTour = factory.updateOne(Tour)

// ** CARA 1 DELETE
// exports.deleteTour = catchAsync(async (req, res, next) => {        
//     try{        
//         await Tour.findByIdAndDelete(req.params.id);
        
//         res.status(204).json({
//             status: 'success delete',
//             time: req.requestTime,
//             data: null
//         });        
//     }catch(err){        
//         return next(new AppError('Invalid delete data 🧨', 404, err));
//     }   
// });
// ** CARA 2 DELETE INI, MENGGUNKANAN handlerFactory biar rapih
exports.deleteTour = factory.deleteOne(Tour);

// ?? PIPELINE LIHAT DOKUMENTASINYA DI MONGODB
exports.getTourStats = async(req, res) =>{    
    try{
        const pipeline = [
            { $match: { ratingsQuantity: { $gte: 5 } } },
            // { $match: { difficulty: "difficult" } },
            // {
            //     $unwind: '$difficulty'
            // },
            {
              $group: {
                _id: {$toUpper: '$difficulty'},
                // _id: '$ratingsAverage',
                sumTours: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: { $avg: '$ratingsQuantity' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
              }
            },
            {
                $sort: {avgPrice: 1}
            },
            // {
            //     $match: {_id: {$ne: 'EASY'}}    // $ne = Not Excluding
            // }
        ];
        
        const stats = await Tour.aggregate(pipeline);
        
        res.status(200).json({
            status: 'success',
            data: {
              stats
            }
        });
    } catch(err){
        res.status(404).json({
            status: "Fail load tours",
            message: err
        })
    }
};
exports.getMonthlyPlan = catchAsync(async(req, res, next) => {
        
    try{
        const year = req.params.year * 1;   // 2021
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStarts: {$sum: 1},
                    tours: {$push: '$name'}
                }
            },
            {
                $addFields: { month: '$_id' }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {numTourStarts: -1}
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
              plan
            }
        });
    } catch(err){
        return next(new AppError('Invalid data 🧨', 404));
    }   
});

// 34.07560862315115, -118.16805132372984
exports.getToursWithin =  catchAsync(async(req, res, next) => { // ** TUJUAN INI YAITU UNTUK MELIHAT TOURS DARI JARAK YANG DIJANGKAU RADIUS MISAL 10KM
    const{ distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng){
        return next(new AppError('Please provide latitude and longtitude in the format lat,lng !', 400));
    }

    const tours = await Tour.find({ startLocation: {$geoWithin: { $centerSphere: [[lng, lat], radius] } } });       // * Kita ingin mencari semua tur yang berlokasi dalam jarak 10 km(radius) dari kota tersebut.

    res.status(200).json({
        status: 'Success',
        results: tours.length,
        data: {
            tours
        }
    }); 
});

exports.getDistances = catchAsync(async(req, res, next) => {        // ** Untuk mendapatkan jarak dari lokasi kita sekrng dengan tour lainnya
    const{ latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001  // ** Jika unit satuan mil maka 1 m == 0.00621371 ATAU Jika unit satuan km maka 1 m == 0.001

    if(!lat || !lng){
        return next(new AppError('Please provide latitude and longtitude in the format lat,lng !', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'Success',
        data: {
            distances
        }
    }); 

});