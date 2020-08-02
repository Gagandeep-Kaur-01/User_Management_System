var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');

var User = require('../models/User');

// ======================== Route for Login page ======================================
router.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if(err) return next(err) 
      if (!user) {
        return res.redirect('login')
      }
      req.logIn(user, function(err) {
        if (err) return next(err);
        return res.redirect('/');
      });    
  })(req, res, next);
});

// ======================== Route for Signup page ===============================
router.get('/signup', function(req, res) {
  res.render('signup', {
    user: req.user
  });
});

router.post('/signup', function(req, res){
  var user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });

  user.save(function(err) {
    req.logIn(user, function(err) {
      res.redirect('/');
    });
  });
});

/*
when create a new User object with the values passed into the form. 
On a successful database save, user is immediately logged-in, 
then redirected to the home page.
*/

// ======================== Route for forgot page ===================================
router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user
  });
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if(!user){
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMPT', {
        service: 'SendGrid',
        auth: {
          user: '!!! YOUR SENDGRID USERNAME !!!',
          pass: '!!! YOUR SENDGRID PASSWORD !!!'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or somone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanges.\n'          
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to' +user.email + 'with further instructions');
        done(err, 'done');
      });
    }
  ], function(err) {
    if(err) return next(err);
    res.redirect('/forgot');
  });
});



router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
