//https://github.com/HussainArif12/UserAuthentication-In-JavaScript/blob/master/config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
// LowDB (because I suck with database technology
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

module.exports = function(passport){
    passport.use(
        new LocalStrategy({usernameField: 'email'},(email,password,done)=>{
            let adapter = new FileSync('db.json');
            let db = low(adapter);
            let user = db.get('users').find({ email: email }).value();
            //console.log("passport user: " + user.email);
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
    );
    passport.serializeUser(function(user,done) {
        console.log('serialize: ' + user)
        done(null,user);
    });
    passport.deserializeUser(function(user,done){
        //console.log('deserialize: ' + user)
        // User.findById(id,function(err,user){
        //     done(err,user);
        // })
        return done(null, user)
    })
};