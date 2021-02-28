const express = require('express');
const router  = express.Router();
const {ensureAuthenticated} = require('../config/auth');
// LowDB (because I suck with database technology
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_z6weHWkcWn5dYY4ZmurzHdfv005Cc0KVGK'
);

//Dashboard
router.get('/',ensureAuthenticated,(req,res)=>{
    console.log(req.originalUrl);
    // Get user data based on Passport.
    let sessionUser = db.get('users').find({ email: req.user }).value();
    // Pass user data in render.
    res.render('dashboard',{
        user: sessionUser,
        menu: "dashboard"
    });
});

// Profile
router.get('/profile',ensureAuthenticated,(req,res)=>{
    // Get user data based on Passport.
    let sessionUser = db.get('users').find({ email: req.user }).value();
    // Pass user data in render.
    res.render('profile',{
        user: sessionUser,
        menu: "profile"
    });
});
router.post('/profile',ensureAuthenticated,(req,res)=>{
    // Get user data based on Passport.
    let sessionUser = db.get('users').find({ email: req.user }).value();
    // Get form field values from the request body.
    const {name,company,companyregistrationnumber} = req.body;

    if (name != null) {
        db.get('users')
            .find({ email: req.user })
            .assign({ name: name})
            .write();
    }
    if (company != null) {
        db.get('users')
            .find({ email: req.user })
            .assign({ company: company})
            .write();
    }
    if (companyregistrationnumber != null) {
        db.get('users')
            .find({ email: req.user })
            .assign({ companyregistrationnumber: companyregistrationnumber})
            .write();
    }
    res.render('profile',{
        user: sessionUser,
        menu: "profile"
    });
});

// Billing
router.get('/billing',ensureAuthenticated,(req,res)=>{
    // Get user data based on Passport.
    sessionUser = db.get('users').find({ email: req.user }).value();
    console.log(sessionUser)
    // Pass user data in render.
    res.render('billing',{
        user: sessionUser,
        subscription: {status: sessionUser.subscription},
        menu: "billing"
    });
});

// Checkout page
router.get('/checkout',ensureAuthenticated,(req,res)=>{
    console.log(req.originalUrl)
    // Get user data based on Passport.
    let sessionUser = db.get('users').find({ email: req.user }).value();
    // Pass user data in render.
    res.render('checkout',{
        user: sessionUser,
        menu: "checkout"
    });
});

router.post("/create-checkout-session", async (req, res) => {
    const { priceId } = req.body;
    console.log(priceId)

    // See https://stripe.com/docs/api/checkout/sessions/create
    // for additional parameters to pass.
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    // For metered billing, do not pass quantity
                    quantity: 1,
                },
            ],
            // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
            // the actual Session ID is returned in the query parameter when your customer
            // is redirected to the success page.
            success_url: 'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://example.com/canceled.html',
        });

        // res.send({
        //     sessionId: session.id,
        // });
        // stripe.redirectToCheckout({ sessionId: session.id });
        res.redirect('https://app.example.io');
    } catch (e) {
        res.status(400);
        return res.send({
            error: {
                message: e.message,
            }
        });
    }
});


module.exports = router;