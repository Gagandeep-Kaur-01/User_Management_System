const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const passport = require('passport');

router.get('/login', (req, res, next) => {
    const messages = req.flash();
    res.render('login', { messages });
});

router.post('/login',passport.authenticate('local',
 { failureRedirect: '/auth/login', failureFlash : 'Wrong username or password'}),
  (req, res, next) => {
      //req.session.save()
      res.redirect('/users');  
});

router.get('/register',(req, res, next) => {
    const messages = req.flash();
    res.render('register', {messages})
});

router.post('/register', (req, res, next) => {
    const registrationParams = req.body;
    const users = req.app.locals.users;
    const payload = {
        username: registrationParams.username,
        password: authUtils.hashPassword(registrationParams.password),
    };

    users.insertOne(payload, (err) => {
        if(err) {
            req.flash('error', 'User account already exists');
        } else {
            req.flash('success', 'User account is registered successfully');
        }

        res.redirect('/auth/register');
    });
});

router.get('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/'); 
});

module.exports = router;
