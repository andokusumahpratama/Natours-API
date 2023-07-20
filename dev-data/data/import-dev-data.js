const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, { //? INI UNTUK CONNECT KE MONGODB ALTAR
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {    
    console.log('DB connection successful!');    
  }).catch((error) => {
    console.error('DB connection failed:', error);
  });

// ! READ JSON FILE 
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); // Import JSON TO OBJECT
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8')); // Import JSON TO OBJECT
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')); // Import JSON TO OBJECT

// ! IMPORT DATA INTO DB
const importData = async() => {
    try{
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });    // ** {validateBeforeSave: false} untuk menghindari validate passwordConfirm. serta matikan dulu middleware pre(save) di userModel
        await Review.create(reviews);

        console.log('Data Successfully Loaded!');
        process.exit();
    }catch(err){
        console.log(err);
    }
}


// ! DELETE ALL DATA FROM COLLECTION
const deleteData = async() => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();

        console.log('Data Successfully Deleted!');
        process.exit();
    }catch(err){
        console.log(err);
    }
}

// ?( node dev-data/data/import-dev-data.js --import ) ketikan ini di terminal
if(process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteData();
}
// console.log(process.argv);
// OUTPUT: 
// [
//     'A:\\Program Files\\NodeJS-v18.16.0\\node.exe',
//     'D:\\projek\\NodeJS\\Course Udemy\\LATIHAN\\Natours Project\\dev-data\\data\\import-dev-data.js'
// ]