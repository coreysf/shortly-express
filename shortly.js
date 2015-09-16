var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'Corey is an awesome guy'
}));

var restrict = function(req, res, next) {
  // console.log("req: " + JSON.stringify(req));
  if(req.session.user) {
    console.log('permission to go to index');
    next();
  } 
  else {
    req.session.error = 'access denied';
    console.log('restricted access to app. please log in');
    res.redirect('login');
  }
};

app.get('/', restrict, function(req, res) {
  console.log("req.session within app.get ('/')" + req.session);
  res.render('index');
});

app.get('/create', restrict, function(req, res) {
  res.render('index');
});

app.get('/links', restrict, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


app.get('/login', 
function(req, res) {
  res.render('login');
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.post('/login', 
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    new User({username: username}).fetch().then(function(user) {
    // does user exist
      // if so
      if (user) {
        // var userSalt = user.get('salt');
        // console.log("userSalt: " + userSalt);
        var userDbHash = user.get('password');
        console.log("userDbHash: " + userDbHash);
        console.log(password);
        bcrypt.compare(password, userDbHash, function(err, result) {
          if(err) {
            throw err;
          }

          if(result) {
            req.session.regenerate(function () {
              console.log('user ' + user);
              req.session.user = user;     // user??
              req.session.success = 'Access granted';
              res.redirect('/');
              console.log("isUser: " + req.session.user);
            });
          } 
        });
      }
      else {
        req.session.error = 'Access denied, please check username and password';
        res.redirect('login');
      } 
    });
  });

app.post('/signup', 
  function(req,res) {
    var username = req.body.username;
    var password = req.body.password;

    // PUT THIS IN HELPER FUNCTION
    // we assume this is a unique username

    console.log("User: " + User);
    new User({ username: username, password: password }).fetch().then(function(user) {
      if (user) {
        res.send(200, user.attributes);
      } else {
      console.log('before create');
        Users.create({
          username: username,
          password: password
        })
        .then(function(user) {
          console.log('after create');
          // res.send(200, user);
          res.redirect('login');
        }).catch(function(err) {
          console.log(err);
        });
      }
    });

    // grab salt value 
    // add salt value to password 
    // generate hashed password
    // insert username, hashed password and salt value into users table 
    // direct user to login site 

  });



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
