const fs = require('fs');
const path = require('path');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');   // Upload Image
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({      // ** ini cara 1, kalau make ini matiin resizeUserPhoto & middleware resizeUserPhoto di userRoute 
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users', )
//     },
//     filename: (req, file, cb) => {
//         // user-423434abv-33232.jpeg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// })
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
exports.uploadUserPhoto = upload.single('photo');  // ? 'photo' => field dari form .pug
exports.resizeUserPhoto = catchAsync(async(req, res, next) =>{
    if(!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);
    next();
})
//** NOTE: UNTUK TES UPLOAD IMAGE HANYA BISA DI POSTMAN DAN NAMA IMAGE TIDAK KESIMPAN KE DALAM DATABASE (SENGAJA) */



const filterObj = (obj, ...allowedFields) => {  // ?? filterObj ini maksudnya adalah hanya membolehkan field name dan email saja, seandainya ada photo atau apapun di req.body (photo: 'ando.jpg') ini diabaikan
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

//? 2) ROUTE HANDLER
// ** CARA 1
// exports.getAllUsers = catchAsync(async(req, res) => {
//     try{       
//         const users = await User.find();

//         res.status(200).json({
//             status: 'success',
//             time: req.requestTime,
//             result: users.length,
//             data: {
//                 users
//             }
//         });
//     } catch(err){
//         return next(new AppError('Tour Not Found', 404), err);
//     }
// });
// ** CARA 2
exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {   // ?? ini untuk update nama dan email user 
    // console.log(req.file);
    // console.log(req.body);

    // ** 1) Create error IF users POSTs password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password update. Please use /updateMyPassword.', 400));
    }

    // ** 2) Filtered unwanted fields names that are not allowed to be updated
    const filterBody = filterObj(req.body, 'name', 'email');

    if(req.file) {        // Untuk cek apakah terdapat request permintaan file dari postman
        filterBody.photo = req.file.filename; // ** ini untuk menyimpan nama photo kedalam database

        const users = await User.findById(req.user._id);

        if(users.photo !== 'default.jpg'){      // ** UNTUK MENGHAPUS FILE IMAGE
            const oldPhotoPath = path.join(__dirname, `../public/img/users/${users.photo}`);
            fs.unlink(oldPhotoPath, (err) => {
                if (err) {
                    return next(new AppError('Error deleting old photo', 400));
                }
            });
        }         
    }

    // ** 3) Update users document non-sensitive
    const updateUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
        new: true, 
        runValidators: true
    });    

    res.status(200).json({
        status: 'Success',
        data: {
            updateUser
        }
    });
});

// ?? DELETE ME ITU MAKSUDNYA NON AKTIFKAN AKUN
exports.deleteMe = catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: "Success Deleted",
        data: null
    });    
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);       // DO NOT update passwords with this!
exports.deleteUser = factory.deleteOne(User);