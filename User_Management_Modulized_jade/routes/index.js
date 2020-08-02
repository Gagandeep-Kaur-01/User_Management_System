var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'User_Authentication_System',
    user: req.user  
  });
});

module.exports = router;