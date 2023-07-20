const AppError = require('./../utils/appError');

// ?? MEMPERCANTIK MESSAGE ERROR
const handleCastErrorDB = (err)=>{
    const message = `Invalid ${err.errors.path}: ${err.errors.value}.`
    return new AppError(message, 400);
}
const handleDuplicateFieldsDB = (err)=> {
    // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    const message = `Duplicate field value ${Object.keys(err.errors.keyPattern)[0]}: ${err.errors.keyValue.name}. Please use another value`;
    return new AppError(message, 400)
}
const handleValidationError = (err)=>{
    const message = `Invalid input data. ${err.errors.message}`;
    return new AppError(message, 400);
}
const handleJWTError = (err)=> {
    return new AppError('Invalid token. please log in again!', 401);
}
const handleJWTExpired = (err)=> {
    return new AppError('Your token has expired! Please log in again.', 401);
}


const sendErrorDev = (err, req, res)=> {
    // * A) API
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err.errors?.message ?? '',   
            stack: err.stack,
        });
    }

    // * B) Render Website
    res.status(err.statusCode).render('error', {
        title: 'Something went error!',
        msg: err.message
    })
}
const sendErrorProd = (err, req, res) => {   
    // * A) API
    if(req.originalUrl.startsWith('/api')){
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,   
            }); 
        }

        return res.status(500).json({
            status: 'Error Broo',
            message: 'Something went very wrong!',            
        });
        
    }else{
    // * B) Render Website
        if(err.isOperational){
            return res.status(err.statusCode).render('error', {
                title: 'Something went error!',
                msg: err.message
            })
        }
        
        res.status(err.statusCode).render('error', {
            title: 'Something went error!',
            msg: 'Please try again later.'
        })        
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){        
        sendErrorDev(err, req, res);
    }else if(process.env.NODE_ENV === 'production'){
        // ?? Handling Invalid Database IDs        
        // sendErrorProd(err, res); // CARA 1 MESSAGE DARI TOURCONTROLLER 
        let error = err;                       
        if(error.errors.name === 'CastError') error = handleCastErrorDB(error);     // ** ERROR SPESIFIC DATA
        if(error.errors.code === 11000) error = handleDuplicateFieldsDB(error);     // ** ERROR NILAI NAME POST SAMA        
        if(error.errors.name === 'ValidationError') error = handleValidationError(error);   // ** ERROR UPDATE        
        if(error.errors === 'JsonWebTokenError') error = handleJWTError(error);    // ** ERROR PADA TOKEN JWT
        if(error.errors === 'TokenExpiredError') error = handleJWTExpired(error);    // ** ERROR PADA TOKEN JWT
        sendErrorProd(error, req, res); // CARA 2 MENGGUNAKAN handleCastErrorDB untuk lebih cantik
    }
}