const express = require('express');
const router  = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const path = require('path');
const cors = require('cors');
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
// LowDB (because I suck with database technology)
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_z6weHWkcWn5dYY4ZmurzHdfv005Cc0KVGK');

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
router.get('/billing',ensureAuthenticated, async (req,res)=>{
    // Get user data based on Passport.
    sessionUser = db.get('users').find({ email: req.user }).value();
    console.log(sessionUser);
    // Create customer ID with stripe if we don't have it.
    if (sessionUser.customerId == null) {
        try {
            const customer = await stripe.customers.create({
                email: sessionUser.email,
                name: sessionUser.company,
                description: sessionUser.name,
            });
            db.get('users')
                .find({ email: req.user })
                .assign({ customerId: customer.id})
                .write();
        } catch (e) {
            console.log(e)
        }
    }
    // Pass user data in render.
    res.render('billing',{
        user: sessionUser,
        subscription: {status: sessionUser.subscription},
        menu: "billing"
    });
});

// Stripe Process
// Fetch the Checkout Session to display the JSON result on the success page
router.get("/checkout-session", async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
});

router.post("/create-checkout-session", cors(), ensureAuthenticated, async (req, res) => {
    // Ensure CORS because fetch is not being nice in some browsers.
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // Get user data based on Passport.
    sessionUser = db.get('users').find({ email: req.user }).value();
    //console.log(sessionUser);

    // Set stripe data.
    const domainURL = "http://localhost:3000";
    const { priceId } = req.body;

    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer: sessionUser.customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
            success_url: `${domainURL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domainURL}/dashboard/billing/error?session_id={CHECKOUT_SESSION_ID}`,
        });

        // Store Session ID in our database so we can process the status on success.
        db.get('stripe').push({ session: session.id, email: sessionUser.email, paid: false}).write();

        res.send({
            sessionId: session.id,
        });
    } catch (e) {
        res.status(400);
        return res.send({
            error: {
                message: e.message,
            }
        });
    }
});

// Stripe Successfull Payment
router.get("/billing/success", (req,res)=>{
    // Get session ID
    const sessionID = req.query.session_id;
    //console.log(sessionID);
    // Get check out session ID data
    stripeSessionData = db.get('stripe').find({ session: req.query.session_id }).value();
    // console.log(stripeSessionData);
    // Update the stripe payment status
    db.get('stripe')
        .find({ session: req.query.session_id })
        .assign({ paid: true})
        .write();
    // Update the user subscription status
    db.get('users')
        .find({ email: stripeSessionData.email })
        .assign({ subscription: true})
        .update('credits', n => n + 100000)
        .write();
    // Redirect to page afterwards.
    res.redirect('/dashboard')
});

// Stripe Failed Payment
router.get("/billing/error", (req,res)=>{
    // Remove the stripe payment from the database to keep things clean :)
    db.get('stripe')
        .remove({ session: req.query.session_id })
        .write();
    // Redirect to page afterwards.
    res.redirect('/dashboard')
});

router.get("/setup", (req, res) => {
    res.send({
        publishableKey: 'pk_test_GDAsvzOIdWS1ui6DKzg4I8nM00BD01U6Ui',
        basicPrice: 'price_1IP2nnG4ihof4FGvFg0NLMGd'
    });
});

router.post('/customer-portal', async (req, res) => {
    // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
    // Typically this is stored alongside the authenticated user in your database.
    const { sessionId } = req.body;
    const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);

    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = process.env.DOMAIN;

    const portalsession = await stripe.billingPortal.sessions.create({
        customer: checkoutsession.customer,
        return_url: returnUrl,
    });

    res.send({
        url: portalsession.url,
    });
});

// Webhook handler for asynchronous events.
router.post("/webhook", async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        // Extract the object from the event.
        data = event.data;
        eventType = event.type;
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    if (eventType === "checkout.session.completed") {
        console.log(`🔔  Payment received!`);
    }

    res.sendStatus(200);
});


module.exports = router;