const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config({path: './config.env'});
const app = require('./app');


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, { //? INI UNTUK CONNECT KE MONGODB ALTAR
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {    
    console.log('DB connection successful!');    
  });

// console.log(app.get('env'));
// console.log(process.env);
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>{
    console.log(`App running on port http://127.0.0.1:${port}`);
});

// ERROR HANDLING 
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLE REJECTION! 🔥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});