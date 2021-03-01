const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

// LowDB (because I suck with database technology
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

//login handle
router.get('/login',(req,res)=>{
    res.render('login');
});
router.get('/register',(req,res)=>{
    res.render('register')
});
//Login handle
router.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        successRedirect : '/dashboard',
        failureRedirect: '/users/login',
        failureFlash : true
    })(req,res,next)
});

//Register post handle
router.post('/register',(req,res)=>{
const {name,email, password, password2} = req.body;
let errors = [];
console.log(' Name ' + name+ ' email :' + email+ ' pass:' + password);
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
    // if (user == undefined) {user = ''};
    // User.findOne({email : email}).exec((err,user)=>{
    console.log(user);
    if(user != undefined && user.email === email) {
        errors.push({msg: 'email already registered'});
        res.render('register',{errors,name,email,password,password2})
    } else {
        // const newUser = new User({
        //     name : name,
        //     email : email,
        //     password : password
        // });
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
                db.get('users').push({ email: email, password: hash, name: name, subscription: false, appCount: 0, profile: "member"}).write();
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