const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

// LowDB (because I suck with database technology
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileSync');
const adapter = new FileAsync('db.json');
const db = low(adapter);

const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

//login handle
router.get('/login',(req,res)=>{
    res.render('login');
});
//Login handle
router.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        successRedirect : '/dashboard',
        failureRedirect: '/users/login',
        failureFlash : true
    })(req,res,next)
});

// Render Register Page
router.get('/register',(req,res)=>{
    res.render('register')
});

//Register post handle
router.post('/register',(req,res)=>{
    const {name,email, password, password2} = req.body;
    let errors = [];
    //console.log(' Name ' + name+ ' email :' + email+ ' pass:' + password);
    if(!name || !email || !password || !password2) {
        errors.push({msg : "Please fill in all fields"})
    }
    //check if match
    if(password !== password2) {
        errors.push({msg : "passwords dont match"});
    }

    //check if password is more than 6 characters
    if(password.length < 6 ) {
        errors.push({msg : 'password atleast 6 characters'})
    }
    if(errors.length > 0 ) {
    res.render('register', {
        errors : errors,
        name : name,
        email : email,
        password : password,
        password2 : password2})
     } else {
        //validation passed
        let user = db.get('users').find({ email: email }).value();

        if(user != undefined && user.email === email) {
            errors.push({msg: 'email already registered'});
            res.render('register',{errors,name,email,password,password2})
        } else {
            let newUser = {
                name : name,
                email : email,
                password : password
            };
            console.log(newUser);

            //hash password
            bcrypt.genSalt(10,(err,salt)=>
            bcrypt.hash(newUser.password,salt,
                (err,hash)=> {
                    if(err) throw err;
                        //save pass to hash
                        newUser.password = hash;
                    //save user
                    // newUser.save()
                    db.get('users').push({ email: email, password: hash, name: name, subscription: false, credits: 0, profile: "member", customerId: null, token: uuidv1()}).write();
                    // .then((value)=>{
                    //     console.log(value)
                        req.flash('success_msg','You have now registered!');
                        res.redirect('/users/login');
                    // })
                    // .catch(value=> console.log(value));

                }));
             }
    }
});

//logout
router.get('/logout',(req,res)=>{
    req.logout();
    req.flash('success_msg','Now logged out');
    res.redirect('/users/login');
    });

module.exports  = router;