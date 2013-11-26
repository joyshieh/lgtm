"use strict";
var config = require("./config");

/**
 * Iteration
 */

function forEach(iterable, iterator) {
  if (typeof iterable.forEach === 'function') {
    iterable.forEach(iterator);
  } else if ({}.toString.call(iterable) === '[object Object]') {
    var hasOwnProp = {}.hasOwnProperty;
    for (var key in iterable) {
      if (hasOwnProp.call(iterable, key)) {
        iterator(iterable[key], key);
      }
    }
  } else {
    for (var i = 0; i < iterable.length; i++) {
      iterator(iterable[i], i);
    }
  }
}

function keys(object) {
  if (Object.getOwnPropertyNames) {
    return Object.getOwnPropertyNames(object);
  } else {
    var result = [];
    forEach(object, function(key) {
      result.push(key);
    });
    return result;
  }
}



/**
 * Property access
 */

function get(object, property) {
  if (object === null || object === undefined) {
    return;
  } else if (typeof object.get === 'function') {
    return object.get(property);
  } else {
    return object[property];
  }
}

function getProperties(object, properties) {
  return properties.map(function(prop) {
    return get(object, prop);
  });
}



/**
 * Array manipulation
 */

function contains(array, object) {
  return array.indexOf(object) > -1;
}

function uniq(array) {
  var result = [];

  for (var i = 0; i < array.length; i++) {
    var item = array[i];
    if (!contains(result, item)) {
      result.push(item);
    }
  }

  return result;
}



/**
 * Promises
 */

function resolve(thenable) {
  var deferred = config.defer();
  deferred.resolve(thenable);
  return deferred.promise;
}

function all(thenables) {
  if (thenables.length === 0) {
    return resolve([]);
  }

  var results = [];
  var remaining = thenables.length;
  var deferred = config.defer();

  function resolver(index) {
    return function(value) {
      results[index] = value;
      if (--remaining === 0) {
        deferred.resolve(results);
      }
    };
  }

  for (var i = 0; i < thenables.length; i++) {
    var thenable = thenables[i];
    resolve(thenable).then(resolver(i), deferred.reject);
  }

  return deferred.promise;
}

function hash(myhash) {
  if (Object.keys(myhash).length === 0) {
    return resolve({});
  }

  var results = {};
  var keys = Object.keys(myhash);
  var remaining = keys.length;
  var deferred = config.defer();

  function resolver(key) {
    return function(value) {
      results[key] = value;
      if (--remaining === 0) {
        deferred.resolve(results);
      }
    };
  }

  function ewResolver(key1, key2) {
    return function(value) {
      if (!results[key1]) {
        results[key1] = {}
      }
      if (!results[key1][key2]) {
        results[key1][key2] = []
      }
      results[key1][key2].push(value);
      if (--remaining === 0) {
        deferred.resolve(results);
      }
    };
  }

  keys.forEach(function(key) {
    var thenablesOrHash = myhash[key];
    if (thenablesOrHash.length === undefined && Object.keys(thenablesOrHash).length > 0) {
      // hash
      var moreKeys = Object.keys(thenablesOrHash);
      remaining += moreKeys.length;
      moreKeys.forEach(function(moreKey) {
        var listOfThenables = thenablesOrHash[moreKey]; // list of thenables
        listOfThenables.forEach(function(thenables) {
          for (var i = 0; i < thenables.length; i++) {
            var thenable = thenables[i];
            resolve(thenable).then(ewResolver(key, moreKey), deferred.reject);
          }
        });
      });
    } else {
      for (var i = 0; i < thenablesOrHash.length; i++) {
        var thenable = thenablesOrHash[i];
        resolve(thenable).then(resolver(key), deferred.reject);
      }
    }
  });

  return deferred.promise;
}


exports.forEach = forEach;
exports.keys = keys;
exports.get = get;
exports.getProperties = getProperties;
exports.contains = contains;
exports.uniq = uniq;
exports.resolve = resolve;
exports.all = all;
exports.hash = hash;