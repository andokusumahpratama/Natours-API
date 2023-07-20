const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {        
        try{        
            const doc = await Model.findByIdAndDelete(req.params.id);

            if(!doc){
                return next(new AppError('No Document found with that ID', 404, err));    
            }
            
            res.status(204).json({
                status: 'success delete',
                time: req.requestTime,
                data: null
            });        
        }catch(err){        
            return next(new AppError('Invalid delete data 🧨', 404, err));
        }   
    });

exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        
        try{        
            const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });       
            
            res.status(200).json({
                status: 'success',
                time: req.requestTime,
                data: {
                    doc
                }
            });        
        }catch(err){        
            return next(new AppError('Invalid data updated 🧨', 404, err));
        }    
    });

exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        try{        
            const doc = await Model.create(req.body); // ? req body untuk melihat body pada json

            res.status(201).json({
                status: 'success',
                data: {
                    doc
                }   
            }); 
        }catch(err){            
            return next(new AppError('Tidak dapat membuat Tour', 404, err));
        }
    });

exports.getOne = (Model, popOPtion) => 
    catchAsync(async (req, res, next) => {        
        try{
            let query = Model.findById(req.params.id);
            if(popOPtion) query = query.populate(popOPtion);
            const doc = await query

            res.status(200).json({
                status: 'success',
                time: req.requestTime,
                data: {
                    doc
                }
            });
        }catch(err){        
            return next(new AppError('No Tour found with that id', 404, err));        
        }
    });

exports.getAll = Model => 
    catchAsync(async (req, res, next) => {    
        try{
            let filter = {};        // ** INI TAMBAHAN DARI reviewController GetAllReview NESTED
            if(req.params.tourId) filter = { tour: req.params.tourId }; // ** INI TAMBAHAN DARI reviewController GetAllReview
            // console.log(req.query); //? Untuk melihat data yg ada di url GET /api/v1/tours?duration=5&difficulty=easy
            // EXECUTE QUERY        
            const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();   // * (Model.find(filter)) filter TAMBAHAN DARI reviewController getAllReview
            const doc = await features.query;
            // const doc = await features.query.explain();  // melihat penjelasan

            //? Send Response
            res.status(200).json({
                status: 'success',
                time: req.requestTime,
                // user: req.user, // ?? req.user ini dari authController.protect 
                result: doc.length,
                data: {
                    doc
                }
            });
        } catch(err){
            return next(new AppError('Tour Not Found', 404), err);
        }
        
    });