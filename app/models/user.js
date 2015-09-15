var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link');


var User = db.Model.extend({
  tableName: 'users',
  links: function() {
    return this.hasMany(Link);
  },

  initialize: function() {
    this.on('creating', function(model, attrs, options){
      return new Promise(function(resolve, reject) {
        // logging 
        console.log(model);
        console.log("options: " + options);
        console.log("user being created!");
        
        // 
        var password = model.get('password');
        var hash = bcrypt.hashSync(password);

        console.log("password: " + password);
        console.log('hash: ' + hash);
        model.set('password', hash);
        
        console.log('isUser: ' + bcrypt.compareSync(password, hash));
        resolve(model);
        reject('error');
      });
    });
  }
});

module.exports = User;