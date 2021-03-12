const express = require('express');
const router  = express.Router();
const {ensureAuthenticated} = require('../config/auth');
// LowDB (because I suck with database technology
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileSync');
const adapter = new FileAsync('db.json');
const db = low(adapter);

//login page
router.get('/', (req,res)=>{
    res.render('welcome');
});
//register page
router.get('/register', (req,res)=>{
    res.render('register');
});

module.exports = router;