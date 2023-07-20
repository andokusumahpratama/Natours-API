const {promisify} = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync'); 
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
// const sendEmail = require('./../utils/email'); 
const Email = require('./../utils/email'); 
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) =>{    
    const token = signToken(user._id);    

    // ** INI UNTUK MENGIRIM COOKIE KE BROWSER DAN MENJAGA KEAMANAN COOKIES
    const cookieOptions = {    
        expires: new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000),        
        httpOnly: true,        
    };
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // ?? Remove password from output/view
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async(req, res, next)=>{
    try{                
        // const newUser = await User.create(req.body);     
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt,
            role: req.body.role
        });
        const token = signToken(newUser._id);
        
        // ** ini ngirim pesan email tentang selamat datang user baru
        const url = `${req.protocol}://${req.get('host')}/me`;
        await new Email(newUser, url).sendWelcome();    // ** Send Email

        createSendToken(newUser,201,res);  // ?? CARA 1
        // res.status(201).json({          // ?? CARA 2
        //     status: 'success',
        //     token,
        //     data: {
        //         user: newUser
        //     }
        // });
    }catch(err){
        return next(new AppError('Tidak dapat membuat User', 404, err));
    }
});

const loginAttempts = {};   // INI UNTUK MENYIMPAN LOG, DARI GAGAL LOGIN
exports.login = catchAsync(async (req, res, next) => {
    try{
        const { email, password } = req.body;
    
        // ** 1) Check if email and password exist
        if(!email || !password){
            return next(new AppError('Please provide email and password', 400));
        }
    
        // ** 2) Check if users exist and password is correct
        const user = await User.findOne({ email }).select('+password');
        const correct = await user.correctPassword(password, user.password); // ? cek password
    
        if(!user || !correct){  // ** KEAMANAN/SECURITY
            // ** Increment login attempts for the same email and device (INI ITUH UNTUK CEK APAKAH USER SUDAH GAGAL MENCOBA LOGIN SEBANYAK 10X? JIKA SUDAH MAKA DIA TIDAK BISA LOGIN KEMBALI SELAMA 1 HARI)
            const loginAttemptKey = `${email}_${req.ip}_${req.headers['user-agent']}`;
            loginAttempts[loginAttemptKey] = (loginAttempts[loginAttemptKey] || 0) + 1;
            console.log(loginAttempts);

            // ** Check if login attempts exceeded the limit
            if (loginAttempts[loginAttemptKey] >= 10) {
                const blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Blocked for 1 day
                return next(new AppError(`Too many failed login attempts. Please try again after ${blockedUntil}`, 401));
            }

            return next(new AppError('Incorrect email and password', 401));
        }

        // ** Reset login attempts for the same email and device
        const loginAttemptKey = `${email}_${req.ip}_${req.headers['user-agent']}`;
        delete loginAttempts[loginAttemptKey];
    
        // ** 3) If everything ok, send token to client    
        createSendToken(user,200,res);  // ?? CARA 1

        // const token = signToken(user._id);  // ?? CARA 2
        // res.status(200).json({   // ?? CARA 2
        //     status: 'success',
        //     token
        // });
    }catch(err){
        return next(new AppError(err.message, 401, err.name));
    }
    
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ status: "success" });
}

exports.protect = catchAsync(async(req, res, next) => {
    try{
        let token;

        // ** 1) Getting token and check of it's there
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){    // ini membaca token di postman
            token = req.headers.authorization.split(' ')[1];
        }else if(req.cookies.jwt){       // Ini untuk membaca token yang ada di web
            token = req.cookies.jwt;
        }

        if(!token){
            return next(new AppError('You are not logged in! please log in to get access', 401));
        }

        // ** 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        // console.log(decoded);    
        
        // ** 3) Check if user still exists (intinya ini case dimana token udah digenerate serta berlaku token selama 2hari. tetapi user menghapus akun. inilah solusinya)
        const freshUser = await User.findById(decoded.id);
        if(!freshUser){
            return next(new AppError('The user token belonging to this token does no longer exist.', 401));            
        }

        // ** 4) Check if user changed password after the token was issued (intinya ini case dimana token udah digenerate serta berlaku token selama 2hari. tetapi user mengganti password. inilah solusinya)
        // freshUser.changePasswordAfter(decoded.iat); // iat adalah waktu token dibuat
        if(freshUser.changePasswordAfter(decoded.iat)){
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }

        req.user = freshUser;
        res.locals.user = freshUser;
        next();
    }catch(err){
        return next(new AppError(err.message, 401, err.name));        
    }
    
});

// ** Ini untuk mengecek user masih login atau tidak di web browser
exports.isLog = async(req, res, next) => {  // ** INI UNTUK MENGECEK JIKA MASIH LOGIN AKUN, DIA TIDAK BISA AKSES HALAMAN LOGIN
    if(req.cookies.jwt){
        try{
            // ** 1) Verification token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // console.log(decoded);    
            
            // ** 2) Check if user still exists (intinya ini case dimana token udah digenerate serta berlaku token selama 2hari. tetapi user menghapus akun. inilah solusinya)
            const freshUser = await User.findById(decoded.id);
            
            if(!freshUser){
                return next();            
            }

            // ** 3) Check if user changed password after the token was issued (intinya ini case dimana token udah digenerate serta berlaku token selama 2hari. tetapi user mengganti password. inilah solusinya)
            if(freshUser.changePasswordAfter(decoded.iat)){
                return next();
            }
            if(freshUser) return res.redirect('/');
        }catch(err){
            return next();  
        }
        
    }
    next();
}
exports.isLoggedIn = async(req, res, next) => {
    if(req.cookies.jwt){       // * Ini untuk membaca token yang ada di web || req.cookies ini bisa karena di app.js ada app.use(cookieParser());
        try{
            // ** 1) Verification token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // console.log(decoded);    
            
            // ** 2) Check if user still exists (intinya ini case dimana token udah digenerate serta berlaku token selama 2hari. tetapi user menghapus akun. inilah solusinya)
            const freshUser = await User.findById(decoded.id);
            
            if(!freshUser){
                return next();            
            }
    
            // ** 3) Check if user changed password after the token was issued (intinya ini case dimana token udah digenerate serta berlaku token selama 2hari. tetapi user mengganti password. inilah solusinya)
            if(freshUser.changePasswordAfter(decoded.iat)){
                return next();
            }
            
            res.locals.user = freshUser;                
            return next();
        }catch(err){
            return next();        
        }        
    }
    return next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not  have permission to perform this action', 403));
        }

        next();
    }
}

exports.forgotPassword =catchAsync(async(req, res, next) => {
    // ** 1) Get user based on Post email 
    const user = await User.findOne({ email: req.body.email });
    if(!user){
        return next(new AppError('There is no user with email address', 404));
    }

    // ** 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // ** 3) Send it to user's email 
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}. \nIf didn't forget password, please ignore this email!`;

    try{        
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token valid for 10 min',
        //     message
        // });
        await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Try again later!', 500, err)); 
    }    
});
exports.resetPassword = catchAsync(async(req, res, next) => {
    // ** 1) Get User based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}}); // mengecek apakah passwordResetToken sama dengan hashedToken, serta apakah passwordResetExpires lebih besar dari waktu sekrang

    // ** 2) If Token has not expired, and there is user, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired!', 400)); 
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // ** 3) Update changedPasswordAt property for the user


    // ** 4) Log the user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});

exports.updatePassword = catchAsync(async(req, res, next) =>{
    // ** 1) Get user from collection        
    const user = await User.findById(req.user.id).select("+password");


    // ** 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong.', 401));
    }

    // ** 3) IF so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save()


    // ** 4) Log user in, send JWT
    createSendToken(user,200,res);
});