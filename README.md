# lx-mongodb [![Build Status](https://travis-ci.org/litixsoft/lx-mongodb.png?branch=master)](https://travis-ci.org/litixsoft/lx-mongodb)

Litixsoft backend driver for mongoDb based on mongojs.

## Install:

```bash
npm install lx-mongodb
```

## Documentation
[http://www.litixsoft.de/products-lxmongodb](http://www.litixsoft.de/products-lxmongodb) (german)

## Examples
### Simple repository
#### Declare
```js
var lxDb = require('lx-mongodb');

exports.UserRepository = function (collection) {
    var schema = function () {
            return {
                'properties': {
                    '_id': {
                        'type': 'string',
                        'required': false,
                        'format': 'mongo-id',
                        'key': true
                    },
                    'birthdate': {
                        'type': 'string',
                        'required': true,
                        'format': 'date-time'
                    },
                    'email': {
                        'type': 'string',
                        'required': true,
                        'format': 'email'
                    },
                    'firstName': {
                        'type': 'string',
                        'required': true
                    },
                    'lastName': {
                        'type': 'string',
                        'required': true
                    },
                    'userName': {
                        'type': 'string',
                        'required': true,
                        'sort': 1
                    },
                    'age': {
                        'type': 'integer',
                        'required': false
                    }
                }
            };
        },
        baseRepo = lxDb.BaseRepo(collection, schema);

    return baseRepo;
};
```

#### Use
```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost/blog?w=1&journal=True&fsync=True', ['users']),
    userRepo = require('./userRepo.js').UserRepository(db.users);

// get all users
userRepo.getAll(function(err, res) {
    console.log(res); // array of users
});

// create new user
userRepo.create({userName: 'Wayne', age: 99}, function(err, res) {
    console.log(res); // user object
});
```

### Repository with validation
#### Declare
```js
var lxDb = require('lx-mongodb');

exports.UserRepository = function (collection) {
    var schema = function () {
            return {
                'properties': {
                    '_id': {
                        'type': 'string',
                        'required': false,
                        'format': 'mongo-id',
                        'key': true
                    },
                    'birthdate': {
                        'type': 'string',
                        'required': true,
                        'format': 'date-time'
                    },
                    'email': {
                        'type': 'string',
                        'required': true,
                        'format': 'email'
                    },
                    'firstName': {
                        'type': 'string',
                        'required': true
                    },
                    'lastName': {
                        'type': 'string',
                        'required': true
                    },
                    'userName': {
                        'type': 'string',
                        'required': true,
                        'sort': 1
                    },
                    'age': {
                        'type': 'integer',
                        'required': false
                    }
                }
            };
        },
        baseRepo = lxDb.BaseRepo(collection, schema);

    // Validierung des User Namens
    baseRepo.checkUserName = function (userName, callback) {
        collection.findOne({userName: userName}, function (err, res) {
            if (err) {
                callback(err);
            } else if (res) {
                callback(null,
                {
                    valid: false,
                    errors: [
                        {
                            attribute: 'checkUserName',
                            property: 'userName',
                            expected: false,
                            actual: true,
                            message: 'userName already exists'
                        }
                    ]
                });
            }
            else {
                callback(null, {valid: true});
            }
        });
    };

    // Definition der Validierungsfunktion
    baseRepo.validate = function (doc, isUpdate, schema, callback) {
        var userNameCheck = true;

        // check is update
        if (isUpdate) {
            for (var schemaProp in schema.properties) {
                if (schema.properties.hasOwnProperty(schemaProp)) {
                    if (!doc.hasOwnProperty(schemaProp)) {
                        schema.properties[schemaProp].required = false;
                    }
                }
            }

            if (!doc.hasOwnProperty('userName')) {
                userNameCheck = false;
            }
        }

        // json schema validate
        var valResult = val.validate(doc, schema, baseRepo.getValidationOptions());

        // register async validator
        if (userNameCheck) {
            val.asyncValidate.register(baseRepo.checkUserName, doc.userName);
        }

        // async validate
        val.asyncValidate.exec(valResult, callback);
    };

    return baseRepo;
};
```

#### Use
```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost/blog?w=1&journal=True&fsync=True', ['users']),
    userRepo = require('./userRepo.js').UserRepository(db.users);

// create new user
userRepo.create({userName: 'Wayne', age: 99}, function(err, res) {
    console.log(res); // User Objekt
});

// JSON schema validation of the user
userRepo.validate({userName: 'Wayne', age: 99}, function(err, res) {
    res.valid === false // true
    res.errors[0].property === 'birthdate' // true
    res.errors[0].message === 'birthdate is required' // true
});

// async schema validation of the user
userRepo.validate({userName: 'Wayne', age: 99}, function(err, res) {
    res.valid === false // true
    res.errors[0].property === 'userName' // true
    res.errors[0].message === 'userName already exists' // true
});
```

## API
### Db connection
#### getDb(connectionString, collections, gridFsCollections)
Creates a connection to the mongoDb using a connection string. The db and the connections are stored in memory.

__Arguments__

* `{!string}` __connectionString__ - The connection string.
* collections(item, callback) - A function to apply to each item in the array.
  The iterator is passed a callback(err) which must be called once it has
  completed. If no error has occured, the callback should be run without
  arguments or with an explicit null argument.
* gridFsCollections(err) - A callback which is called after all the iterator functions
  have finished, or an error has occurred.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

## Release History
### v0.3.4
* add gridFs error handling

### v0.3.3
* gridFs implemented with mongojs

### v0.3.2
* fix error in function create(), now also arrays can be passed as doc

### v0.3.1
* fix error in function convertToMongoId(), $in array with mongoId's was not identified correctly

### v0.3.0
* update lx-helpers
* refactor to take advantage of the new type checking in lxHelpers
* refactor sort option, it can be now a string, array or object

### v0.2.6
* refactor some param checks to callback with an TypeError instead of throwing an exception

### v0.2.5
* refactor baseRepo.delete()
* update tests
* change deprecated mongo option {safe: true} to {w: 1}

### v0.2.4
* callback with TypeError in getById() when id is null or undefined

### v0.2.3
* change some Errors to TypeErrors
* callback with TypeError in getById() when id is of wrong type

### v0.0.1 project initial

## Roadmap

### v0.1.0 first stable version

## Author
[Litixsoft GmbH](http://www.litixsoft.de)

## License
Copyright (C) 2013 Litixsoft GmbH <info@litixsoft.de>
Licensed under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.