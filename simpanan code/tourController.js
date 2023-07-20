const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('./errorController');

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


//? 2) ROUTE HANDLER
exports.getAllTours = async (req, res) => {
    try{
        // ? Membuat Query
        console.log(req.query); //? Untuk melihat data yg ada di url GET /api/v1/tours?duration=5&difficulty=easy
        // EXECUTE QUERY        
        const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate(); 
        const tours = await features.query;

        //? Send Response
        res.status(200).json({
            status: 'success',
            time: req.requestTime,
            result: tours.length,
            data: {
                tours
            }
        });
    } catch(err){
        res.status(404).json({
            status: "Fail load tours",
            message: err
        });
    }
};
exports.getTour = async (req, res) => {
    try{
        const tour = await Tour.findById(req.params.id);   // params untuk melihat 127.0.0.1:8000/api/v1/tours/ //? 648d800df2ecb946dbe911b1
        // const tour = await Tour.findOne({_id: req.params.id});   // CARA2 params untuk melihat 127.0.0.1:8000/api/v1/tours/ //? 648d800df2ecb946dbe911b1

        res.status(200).json({
            status: 'success',
            time: req.requestTime,
            data: {
                tour
            }
        });
    }catch(err){
        res.status(404).json({
            status: "Fail load tour",
            message: err
        });
    }
}

exports.createTour = async (req, res) => {
    try{        
        const newTour = await Tour.create(req.body); // ? req body untuk melihat body pada json

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }   
        }); // Created Status
    }catch(err){
        res.status(404).json({
            status: 'Fail',
            message: err 
        });
    }
    
};
exports.updateTour = async (req, res) => {
    try{        
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: false
        });       
        
        res.status(200).json({
            status: 'success',
            time: req.requestTime,
            data: {
                tour
            }
        });        
    }catch(err){
        res.status(404).json({
            status: 'Fail',
            message: 'Invalid data Send 🧨'
        });
    }
}
exports.deleteTour = async (req, res) => {
    try{        
        await Tour.findByIdAndDelete(req.params.id);
        
        res.status(204).json({
            status: 'success delete',
            time: req.requestTime,
            data: null
        });        
    }catch(err){
        res.status(404).json({
            status: 'Fail',
            message: 'Invalid data Send 🧨'
        });
    }
}

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
}
exports.getMonthlyPlan = async(req, res) => {
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
        res.status(404).json({
            status: "Fail load tours",
            message: err
        })
    }
}