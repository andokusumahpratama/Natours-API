// import '@babel/polyfill';
import {displayMap} from './mapbox';
import { login, logout } from './login';
// import { updateData } from './updateSetting';
import { updateSetting } from './updateSetting';
import { bookTour } from './stripe';

// ** DOM ELEMENT DATENG DARI .PUG
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const mapBox = document.getElementById('map');
const userDataForm = document.querySelector('.form-user-data'); // ** FORM UPDATE DATA NAME & EMAIL
const userPasswordForm = document.querySelector('.form-user-password'); // ** FORM UPDATE PASSWORD
const bookBtn = document.getElementById('book-tour');

// ** VALUES
let name = document.getElementById('name');
let email = document.getElementById('email');
const password = document.getElementById('password');

// ** 1 Map Box
if(mapBox){ // ** Delegation
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
    displayMap(locations);
}

// ** 2 Login Function
if(loginForm){
    
    loginForm.addEventListener('submit', e => {
        e.preventDefault();            
        login(email.value, password.value);
    });
}

// ** 3 Logout Function
if(logoutBtn) logoutBtn.addEventListener('click', logout);

// ** 4 Update User & user Photo
const photoInput = document.getElementById('photo');
const userPhoto = document.querySelector('.form__user-photo');
if(photoInput){ //* Ini untuk merubah otomatis tampilan foto user ketika dipilih
    // Tambahkan event listener untuk perubahan pada input file
    photoInput.addEventListener('change', function() {
      const file = this.files[0];
      
      // Buat objek FileReader
      const reader = new FileReader();
    
      // Atur event listener untuk FileReader saat selesai membaca file
      reader.addEventListener('load', function() {
        // Tampilkan gambar yang dipilih di elemen gambar user
        userPhoto.src = reader.result;
      });
    
      // Baca file sebagai URL data gambar
      if (file) {
        reader.readAsDataURL(file);
      }
    });
}
if(userDataForm){
    userDataForm.addEventListener('submit', e =>{
        e.preventDefault();
        // name = name.value;
        // email = email.value;
        // updateSetting({ name, email }, 'data');
        
        const form = new FormData();
        form.append('name', name.value);
        form.append('email', email.value);
        form.append('photo', document.getElementById('photo').files[0]);

        // console.log('FormData entries:');
        // for (const [key, value] of form.entries()) {
        //     console.log(key, value);
        // }
        
        updateSetting(form, 'data');
    });
}

// ** 5 Update Password
if(userPasswordForm){
    userPasswordForm.addEventListener('submit', async e =>{
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...';
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSetting({ passwordCurrent, password, passwordConfirm }, 'password');

        document.querySelector('.btn--save-password').textContent = 'Save password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

// ** 6 Booking Tour
if(bookBtn){
    bookBtn.addEventListener('click', e=> {
        e.target.textContent = 'Processing...'  // Loading, || target tuh maksudnya target mouse klick button
        const tourId = e.target.dataset.tourId;
        bookTour(tourId);
    })
}