var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link');
var crypto = require('crypto');


var User = db.Model.extend({
  tableName: 'users',
  links: function() {
    return this.hasMany(Link);
  },

  initialize: function() {
    this.on('creating', function(model, attrs, options){
      console.log("user being created!");
      var password = model.get('password');
      return new Promise(function(resolve, reject) {
        console.log("Inside promise!");
        bcrypt.genSalt(10, function(err, result) {
          if (err) {
            throw err;
          }
          bcrypt.hash(password, result, null, function(err, hash) {
              console.log("Inside hash!");
              if (err) {
                reject(err);
              }

              model.set('password', hash);
              model.set('salt', result);
              resolve(model);
          });
        });
      });

     

       
      //     // Load hash from your password DB.
      // bcrypt.compare("bacon", hash, function(err, res) {
      //     // res == true
      // });
      // bcrypt.compare("veggies", hash, function(err, res) {
      //     // res = false
      // });


      // var shasum = crypto.createHash('sha1');
      // console.log("shasum: " + shasum);
      // shasum.update(model.get('password'));
      // console.log("shasum after update: " + shasum);
      // model.set('password', shasum.digest('hex'));
      // model.set('salt', shasum);
    });
  }
});

module.exports = User;