// ! BERIKUT CONTOH NO QUERY PADA NODE JS MONGODB MENGGUNAKAN MONGOOSE
const mongoose = require('mongoose');
const dotenv = require("dotenv");

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

// ? Membuat Schema Untuk Tour
const tourSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: [true, 'A tour must have a name'],
        unique: true
    },
    rating: {
        type: String, 
        default: 4.5
    },
    price: {
        type: Number, 
        required: [true, 'A tour must have a price']
    },
});

// ? Membuat Collection/Model Tour
const Tour = mongoose.model('Tour', tourSchema);

// ? Membuat Data Kedalam Collection Tour
const testTour = new Tour({
    name: 'The Forest Hiker',
    rating: 4.7,
    price: 497
});

// ? Menyimpan Data kedalam Tour
testTour.save().then(doc => {
    console.log(doc);
}).catch((err) => {
    console.log(`Error broo 🧨: ${err}`);
});

// ? Menampilkan data yang ada didalam collection Tour
Tour.find().then((natours) => {
    console.log('Data from "natours" collection:', natours);
  }).catch((error) => {
    console.error('Error querying "natours" collection:', error);
  });

// ? Merubah data yang ada didalam collection Tour
  Tour.updateOne({ name: 'The Forest Hiker' }, { $set: { name: 'The Forest' } })
  .then(() => {
    console.log('Data updated successfully!');
  })
  .catch((error) => {
    console.error('Error updating data:', error);
  });

// ? Menghapus data dari koleksi Tour berdasarkan kriteria tertentu
Tour.deleteOne({ name: 'The Forest Hiker' })
  .then(() => {
    console.log('Data deleted successfully!');
  })
  .catch((error) => {
    console.error('Error deleting data:', error);
  });


//! 1  ====== Membuat Data Banyak Kedalam Collection Tour ======
  const tours = [
    { name: 'Tour 1', rating: 4.5, price: 100 },
    { name: 'Tour 2', rating: 4.2, price: 150 },
    { name: 'Tour 3', rating: 4.7, price: 200 },
    // Tambahkan data lain sesuai kebutuhan Anda
  ];
  
// ! 1 ====== Menyimpan Data kedalam Tour ======
  Tour.insertMany(tours)
    .then(() => {
      console.log('Data created successfully!');
    })
    .catch((error) => {
      console.error('Error creating data:', error);
    });

// ! 1 ====== Menghapus banyak data dari koleksi Tour berdasarkan kriteria tertentu ======
Tour.deleteMany({ rating: { $lt: 4.5 } })
.then(() => {
  console.log('Data deleted successfully!');
})
.catch((error) => {
  console.error('Error deleting data:', error);
});

// ! 1 ====== Menghapus banyak data dari koleksi Tour berdasarkan kriteria tertentu ======
Tour.updateMany({ name: 'The Forest Hiker' }, { $set: { price: 20 } })
  .then(() => {
    console.log('Data updated successfully!');
  })
  .catch((error) => {
    console.error('Error updating data:', error);
  });

// ! 1 ====== Menghapus Satu data dari koleksi Tour berdasarkan kriteria tertentu ======
  Tour.findOneAndUpdate({ name: 'The Forest Hiker' }, { $set: { price: 20 } }, { new: true })
  .then((updatedDoc) => {
    console.log('Data updated successfully:', updatedDoc);
  })
  .catch((error) => {
    console.error('Error updating data:', error);
  });


  const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy'); // CARA MENCARI TAHU YANG LEBIH SPESIFIK