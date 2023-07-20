const express = require('express');
const userController = require('./../controller/userController');
const authController = require('./../controller/authController');

//? ROUTES
const router = express.Router();


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);


router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect); // ? "jika menggunakan ini makan baris code yang dibawahnya akan mengikuti menggunakan authController.protect sehingga tidak perlu dibuat seperti router.patch('/updateMyPassword', authController.protect, authController.updatePassword);"

router.patch('/updateMyPassword',authController.updatePassword);

router.get('/me',userController.getMe, userController.getUser); // ID user didapatkan dari Token protect
router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
router.delete('/deleteMe',userController.deleteMe);

// ?? USER
router.use(authController.restrictTo('admin'));     //** Dengan menggunakan ini routes setelah baris ini akan menjadi seperti  router.route('/').get(authController.restrictTo('admin'), userController.getAllUsers);
router.route('/').get(userController.getAllUsers);
router.route('/:id').patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;