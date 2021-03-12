const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

// LowDB (because I suck with database technology
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

// create application/json parser
const jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// POST /login gets urlencoded bodies
router.post('/login', cors(), jsonParser, function (req, res) {
    const { email, password, counter } = req.body;

    // Find user based on email
    let user = db.get('users').find({ email: email }).value();
    console.log(user);
    if (user.token == null) {
        token = uuidv1();
        db.get('users')
            .find({ email: email })
            .update('token', token)
            .write();
    } else {
        token = user.token
    }
    //match passwords
    bcrypt.compare(password,user.password,(err,isMatch)=>{
        if(err) throw err;
        if(isMatch && user.subscription == true){
            // Increment App Count
            if (counter) {
                db.get('users')
                    .find({ email: email })
                    .update('credits', n => n - 1)
                    .write();
            }
            // return done(null,user.email);
            res.send({'authentication': true, 'credits': user.credits, 'token': token})
        } else{
            // return done(null,false,{message: 'password incorrect'});
            res.send({'authentication': false})
        }
    });
    // res.send({'email': password})
});

// POST /login gets urlencoded bodies
router.post('/token', cors(), jsonParser, function (req, res) {
    const {token, counter} = req.body;
    // Find user based on token
    let user = db.get('users').find({token: token}).value();
    // Reduce counter
    if (counter) {
        db.get('users')
            .find({token: token})
            .update('credits', n => n - 1)
            .write();
    }
    res.send({'credits': user.credits})
});

module.exports = router;