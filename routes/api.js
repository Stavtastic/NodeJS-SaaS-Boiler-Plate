const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors')
const bcrypt = require('bcrypt');

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
    console.log(email+password+counter)

    // Find user based on email
    let user = db.get('users').find({ email: email }).value();

    //match passwords
    bcrypt.compare(password,user.password,(err,isMatch)=>{
        if(err) throw err;
        if(isMatch && user.subscription == true){
            // Increment App Count
            if (counter) {
                db.get('users')
                    .find({ email: email })
                    .update('appCount', n => n + 1)
                    .write();
            }
            // return done(null,user.email);
            res.send({'authentication': true})
        } else{
            // return done(null,false,{message: 'password incorrect'});
            res.send({'authentication': false})
        }
    });
    // res.send({'email': password})
});

//Login External
// router.post("/login", (req, res) => {
//     const {email,password} = req.body;
//     console.log(email+password);
//     res.send({
//         sessionId: false
//     });
// });

module.exports = router;