import config from './config';
import { all, resolve, contains, keys, forEach, get, uniq, hash } from './utils';

function ObjectValidator() {
  this._validations  = {};
  this._dependencies = {};
}

ObjectValidator.prototype = {
  _validations  : null,
  _dependencies : null,

  addValidation: function(attr, fn, message) {
    var list = this._validations[attr];

    if (!list) {
      list = this._validations[attr] = [];
    }

    list.push([fn, message]);
  },

  addEachValidation: function(attr, eachAttr, fn, message) {
    if (!this._validations[attr]) { this._validations[attr] = {}; }

    var list = this._validations[attr][eachAttr];

    if (!list) {
      list = this._validations[attr][eachAttr] = [];
    }

    list.push([fn, message]);
  },

  // e.g. spouseName (dependentAttribute) depends on maritalStatus (parentAttribute)
  addDependentsFor: function(/* parentAttribute, ...dependentAttributes */) {
    var dependentAttributes = [].slice.apply(arguments);
    var parentAttribute = dependentAttributes.shift();

    var dependentsForParent = this._dependencies[parentAttribute];

    if (!dependentsForParent) {
      dependentsForParent = this._dependencies[parentAttribute] = [];
    }

    for (var i = 0; i < dependentAttributes.length; i++) {
      var attr = dependentAttributes[i];
      if (!contains(dependentsForParent, attr)) {
        dependentsForParent.push(attr)
      }
    }
  },

  attributes: function() {
    return uniq(
      keys(this._validations).concat(
        keys(this._dependencies)
      )
    );
  },

  validate: function(/* object, attributes..., callback */) {
    var attributes = [].slice.apply(arguments);
    var object = attributes.shift();
    var callback = attributes.pop();
    var self = this;

    if (typeof callback === 'string') {
      attributes.push(callback);
      callback = null;
    }

    if (attributes.length === 0) {
      attributes = keys(this._validations);
    }

    var validationPromises = {};
    for (var i = 0; i < attributes.length; i++) {
      var attr = attributes[i];
      validationPromises[attr] = this._validateAttribute(object, attr); // This can be an array or a hash
    }

    var promise = hash(validationPromises).then(
      function(results) {
        results = self._collectResults(results);
        if (callback) {
          callback(null, results);
        }
        return results;
      },
      function(err) {
        if (callback) {
          callback(err);
        }
        throw err;
      });

    if (!callback) {
      return promise;
    }
  },

  _validateAttribute: function(object, attr) {
    var value       = get(object, attr);
    var validations = this._validations[attr];

    if (validations && validations.length === undefined && keys(validations).length > 0) {
      var resultHash = {};
      keys(validations).forEach(function(key) {
        resultHash[key] = this._validateEachAttribute(object, attr, key);
      }, this);
      return resultHash;
    }

    var results     = [];
    if (validations) {
      validations.forEach(function(pair) {
        var fn      = pair[0];
        var message = pair[1];

        var promise = resolve()
          .then(function() {
            return fn(value, attr, object);
          })
          .then(function(isValid) {
            return [ attr, isValid ? null : message ];
          });

        results.push(promise);
      });
    } else if (contains(this.attributes(), attr)) {
      results.push([ attr, null ]);
    }

    // // what tod o with dependents
    // var dependents = this._getDependentsFor(attr);
    // for (var i = 0; i < dependents.length; i++) {
    //   var dependent = dependents[i];
    //   results = results.concat(this._validateAttribute(object, dependent));
    // }

    return results;
  },

  _validateEachAttribute: function(object, attr, eachAttr) {
    var objects     = get(object, attr);
    var validations = this._validations[attr][eachAttr];
    var results     = [];

    objects.forEach(function(obj) {
      var value = obj.get(eachAttr);
      var objectResults = [];
      if (validations) {
        validations.forEach(function(pair) {
          var fn      = pair[0];
          var message = pair[1];

          var promise = resolve()
            .then(function() {
              return fn(value, eachAttr, obj);
            })
            .then(function(isValid) {
              return [ eachAttr, isValid ? null : message ];
            });

          objectResults.push(promise);
        });
      } else if (contains(this.attributes(), eachAttr)) { // validations and dependencies
        objectResults.push([ eachAttr, null ]);
      }

      // // what to do with dependents
      // var dependents = this._getDependentsFor(attr);
      // for (var i = 0; i < dependents.length; i++) {
      //   var dependent = dependents[i];
      //   results = results.concat(this._validateAttribute(object, dependent));
      // }

      // objectResults is the list of validations on a property.
      // results is a list of objectResults, one for each object in the collection.
      results.push(objectResults);
    });

    return results;
  },

  _collectResults: function(results) {
    var result = {
      valid  : true,
      errors : {}
    };

    var keys = Object.keys(results);
    keys.forEach(function(key) {
      var keyResult = results[key];

      if (keyResult.length === undefined && Object.keys(keyResult).length > 0) {
        Object.keys(keyResult).forEach(function(attr) {
          var messageList = results[key][attr];
          var keyMessages = result.errors[key]
          if (!keyMessages) {
            keyMessages = result.errors[key] = {};
          }
          var messages = result.errors[key][attr];

          if (!messages) {
            messages = result.errors[key][attr] = [];
          }

          messageList.forEach(function(message) {
            messages.push(message[1]);
            if (message[1]) {
              result.valid = false;
            }
          });
        });
      } else {
        var attr = results[key][0];
        var message = results[key][1];
        var messages = result.errors[attr];

        if (!messages) {
          messages = result.errors[attr] = [];
        }

        if (message) {
          messages.push(message);
          result.valid = false;
        }
      }
    });
    for (var i = 0; i < results.length; i++) {
      if (!results[i]){ continue; }

      var attr = results[i][0];
      var message = results[i][1];
      var messages = result.errors[attr];

      if (!messages) {
        messages = result.errors[attr] = [];
      }

      if (message) {
        messages.push(message);
        result.valid = false;
      }
    }

    return result;
  },

  // e.g. getDependents("maritalStatus")  # => ["spouseName"]
  _getDependentsFor: function(parentAttribute) {
    return (this._dependencies[parentAttribute] || []).slice();
  }
};

export default ObjectValidator;
