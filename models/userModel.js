const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Name, Email, Photo, Password, passwordConfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        require: [true, 'A user must have a name'],        
    },
    email: {
        type: String,
        require: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String, 
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm a password'],
        validate: {
            validator: function(el){
                return el === this.password;
            },
            message: `Password are not the same!`
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        default: true,
        select: false
    }
});

// ** ENKRIPSI PASSWORD
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;       // ** UNTUK TIDAK MEMASUKAN PASSWORD COFIRM KEDALAM DATABASE
    next();
});

// ** UNTUK CEK APAKAH PERNAH DIMODIFIKASI password atau mengganti password
userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // ?? KENAPA ENGGA DI userSchema.pre di ENKRIPSI PASSWORD. KARENA YANG DIATAS UNTUK MELAKUKAN REGISTER. DAN KENAPA ENGGA DI changePasswordAfter KARENA ITU UNTUK MELAKUKAN CEK JIKA TERJADI KASUS TOKEN SUDAH DIGENERATE 2 HARI, TAPI PASSWORD SUDAH DIGANTI, SEHINGGA MENGHINDARI NYANGKUTNYA TOKEN SETELAH GANTI PASSWORD
    next();
});

// ** UNTUK MENAMPILKAN USER YANG AKTIF, JIKA TIDAK AKTIF TIDAK DITAMPILKAN 
userSchema.pre(/^find/, function(next){
    // This points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// ** UNTUK CEK APAKAH SAAT LOGIN, PASSWORD SUDAH SESUAI ATAU TIDAK
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
};

// ** UNTUK CEK APAKAH USER MENGGANTI PASSWORD
userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() /1000);

        // console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp; // Dikomparasi apakah JWTTtimestamp (tanggal pertama dibuat) < dari changedTimestamp (tanggal berubah di this.passwordChangedAt)
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // ?? ini artinya 10 menit

    console.log({resetToken}, this.passwordResetToken);

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;