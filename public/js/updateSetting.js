import axios from 'axios';
import { showAlert } from './alert';

// export const updateData = async(name, email) => {
//     try{
//         const res = await axios({
//             method: 'PATCH',
//             url: 'http://127.0.0.1:8000/api/v1/users/updateMe', //* jadi ini akan ngelink ke /api/v1/users/updateMe mengikuti aturan yang ada di userController.updateMe karena route akan otomatis mendeteksi permintaan dari browser
//             data: {
//                 name,
//                 email
//             }
//         });
//         if(res.data.status === 'Success'){
//             showAlert('success', 'Data updated successfully');
//             location.reload(true);      // Ini untuk merefresh
//         }
//     }catch(err){
//         showAlert('error', err.response.data.message);
//     }
// }


// ** type is either 'password' or 'data'
export const updateSetting = async(data, type) => {
    try{
        const url = type === 'password' ? 'http://127.0.0.1:8000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:8000/api/v1/users/updateMe';
        console.log(url);
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });
        if(res.data.status === 'Success'){            
            showAlert('success', `${type.toUpperCase()} updated successfully`);
            location.reload(true);      // Ini untuk merefresh
        }
    }catch(err){
        showAlert('error', err.response.data.message);
    }
}