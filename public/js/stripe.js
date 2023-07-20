import axios from 'axios';
import { showAlert } from './alert';
// stripe ini dari panggilan script yang ada di tour.pug script(src='https://js.stripe.com/v3/')
const stripe = Stripe('pk_test_51NVbBuI9jiU90IRR8P4jD3cA2waUFYSUOecC11lFSuiWwTCb6tAAusPggziuf8elJ4hRTToo9HE3mZfwWtrYC1vl00pl4MSvAB');

export const bookTour = async tourId => {
    try{
        // 1) Get checkout session from API
        const session = await axios(`http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);
    
        // 2) Create checkout form + chanre credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    }catch(err){
        console.log(err); 
        showAlert('error', err);
    }
}