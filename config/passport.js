//https://github.com/HussainArif12/UserAuthentication-In-JavaScript/blob/master/config/passport.js
// const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
// LowDB (because I suck with database technology
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

module.exports = function(passport){
    passport.use(
        new LocalStrategy({usernameField: 'email'},(email,password,done)=>{
            console.log('email: ' + email + 'password: ' + password)

            let user = db.get('users').find({ email: email }).value();
            console.log(user);
            if (user == null) {
                return done(null,false,{message:'email not registered'});
            }
            //match passwords
            bcrypt.compare(password,user.password,(err,isMatch)=>{
                if(err) throw err;
                if(isMatch){
                    return done(null,user.email);
                } else{
                    return done(null,false,{message: 'password incorrect'});
                }
            })
        })
    )
    passport.serializeUser(function(user,done) {
        console.log('serialize: ' + user)
        done(null,user);
    });
    passport.deserializeUser(function(user,done){
        console.log('deserialize: ' + user)
        // User.findById(id,function(err,user){
        //     done(err,user);
        // })
        return done(null, user)
    })
};



// if (user != undefined && user.email === email) {
//
//     //match passwords
//     bcrypt.compare(password,user.password,(err,isMatch)=>{
//         if(err) throw err;
//         if(isMatch){
//             return done(null,user.email);
//         } else{
//             return done(null,false,{message: 'password incorrect'});
//         }
//     })
//     // return user.email;
// } else {
//
// }