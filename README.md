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
### DB connection

<a name="getDb" />
#### getDb(connectionString, collections, gridFsCollections)
Creates a connection to the mongoDb using a connection string. The db and the connections are stored in memory.

Note: When querying the metadata of gridFsCollections, you need to add them to the collections array. See examples.

__Arguments__

* `{!string}` __connectionString__ - The connection string.
* `{!Array.<string>}` __collections__ - The names of the mongo collections.
* `{Array.<string>=}` __gridFsCollections__ - The names of the gridfs collections.

__Examples__

```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['posts', 'tags', 'comments']);
```

```js
// with gridfs collections
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['posts', 'tags', 'comments'], ['documents']);
```

```js
// with gridfs collections and collection for querying the gridfs metadata
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['posts', 'tags', 'comments', 'documents.files', 'pdf.files'], ['documents', 'pdf']);
```
---
### Base repository

<a name="BaseRepository" />
#### BaseRepository(collection, schema)
Creates a new repository with the base mongoDb operations. Each mongoDb collection uses the base repository. If you need all the functions of the native mongoDb js driver,
you can call `getCollection()` on the base repository to get the mongoDb collection.

__Arguments__

* `{!Object}` __collection__ - The mongoDb colllection.
* `{(Object|Function)=}` __schema__ - The JSON schema. Is used to get the id field and the default sorting.

__Example__

```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['posts', 'tags', 'comments']),
    postRepo = lxDb.BaseRepo(db.posts);
```

<a name="createNewId" />
#### createNewId()
Returns a new mongo ObjectId.

__Example__

```js
var repo = basreRepo(collection, schema),
    _id = repo.createNewId();

_id instanceof ObjectID === true; // true
```

<a name="convertId" />
#### convertId(id)
Converts a `string` to a mongo `ObjectID` and vice versa.

__Arguments__

* `{Object|string}` __id__ - The id to convert.

__Example__

```js
var repo = basreRepo(collection, schema),
    _id = repo.createNewId(),
    idString = repo.convertId(_id);

typeof idString === 'string'; // true
```

<a name="create" />
#### create(doc, callback)
Creates one or more records in the mongoDb.

__Arguments__

* `{Array|Object}` __doc__ - The data.
* `{function(err, res)}` __callback__ - The callback function.

__Example__

```js
var repo = basreRepo(collection, schema);

repo.create({name: 'Litixsoft', city: 'Leipzig'}, function(err, res) {
    // more logic here
});
```

<a name="delete" />
#### delete(query, callback)
Deletes one or more records in the mongoDb.

__Arguments__

* `{Object}` __query__ - The query.
* `{function(err, res)}` __callback__ - The callback function.

__Example__

```js
var repo = basreRepo(collection, schema);

repo.delete({_id: '5108e9333cb086801f000035'}, function(err, res) {
    // more logic here
});

repo.delete({city: 'Berlin'}, function(err, res) {
    // more logic here
});
```

<a name="getAll" />
#### getAll(query, options, callback)
Gets the records from the mongoDb.

__Arguments__

* `{Object=}` __query__ - The query.
* `{Object=}` __options__ - The mongoDb query options.
* `{(Array|Object)=}` __options.fields__ - The fields which should be returned by the query.
* `{Number=}` __options.limit__ - The number of records which should be returned by the query.
* `{Number=}` __options.skip__ - The number of records which should be skipped by the query.
* `{(Array|String|Object)=}` __options.sort__ - The sorting of the returned records.
* `{function(err, res)}` __callback__ - The callback function.

__Example__

```js
var repo = basreRepo(collection, schema);

repo.getAll({}, function(err, res) {
    // more logic here
});

repo.getAll({name: 'Litixsoft'}, {skip: 0, limit: 10, sort: {name: 1}, fields: ['name', 'city']}, function(err, res) {
    // more logic here
});
```

<a name="getCollection" />
#### getCollection()
Returns the mongoDb collection object.

__Example__

```js
var repo = basreRepo(collection, schema),
    myCollection = repo.getCollection();

collection == myCollection; // true
```

<a name="getCount" />
#### getCount(query, callback)
Returns the number of records.

__Arguments__

* `{Object}` __query__ - The query.
* `{function(err, res)}` __callback__ - The callback function.

__Example__

```js
var repo = basreRepo(collection, schema);

repo.getCount({}, function(err, res) {
    // more logic here
});
```

<a name="getOne" />
#### getOne(query, options, callback)
Gets one record from the mongoDb.

__Arguments__

* `{Object=}` __query__ - The query.
* `{Object=}` __options__ - The mongoDb query options.
* `{(Array|Object)=}` __options.fields__ - The fields which should be returned by the query.
* `{Number=}` __options.limit__ - The number of records which should be returned by the query.
* `{Number=}` __options.skip__ - The number of records which should be skipped by the query.
* `{(Array|String|Object)=}` __options.sort__ - The sorting of the returned records.
* `{function(err, res)}` __callback__ - The callback function.

__Example__

```js
var repo = basreRepo(collection, schema);

repo.getOne({name: 'Litixsoft'}, function(err, res) {
    // more logic here
});

repo.getOne({name: 'Litixsoft'}, {skip: 0, limit: 10, sort: {name: 1}, fields: ['name', 'city']}, function(err, res) {
    // more logic here
});
```

<a name="getOneById" />
#### getOneById(id, options, callback)
Gets one record by id from the mongoDb.

__Arguments__

* `{Object|string}` __id__ - The id.
* `{Object=}` __options__ - The mongoDb query options.
* `{(Array|Object)=}` __options.fields__ - The fields which should be returned by the query.
* `{function(err, res)}` __callback__ - The callback function.

__Example__

```js
var repo = basreRepo(collection, schema),
    myId = repo.convertId('5108e9333cb086801f000035');

repo.getOneById('5108e9333cb086801f000035', function(err, res) {
    // more logic here
});

repo.getOneById(myId, {fields: ['name', 'city']}, function(err, res) {
    // more logic here
});
```

<a name="getSchema" />
#### getSchema()
Returns the JSON schema.

__Example__

```js
var repo = basreRepo(collection, schema),
    mySchema = repo.getSchema();

schema == mySchema; // true
```

<a name="getValidationOptions" />
#### getValidationOptions()
Returns an object with the validation options. This is especially useful in combination with [lx-valid](https://github.com/litixsoft/lx-valid).
The method `convert()` can also be used by other schema validators.

__Example__

```js
var repo = basreRepo(collection, schema),
    options = repo.getValidationOptions();

options.deleteUnknownProperties === true; // true
typeof options.convert === 'function'; // true
```

<a name="update" />
#### update(query, update, callback)
Updates one or more records in the mongoDb.

__Arguments__

* `{Object}` __query__ - The query.
* `{Object}` __update__ - The data to update.
* `{function(err, res)}` __callback__ - The callback function.

* __query__ `{Object}` The query.
* __update__ `{Object}` The data to update.
* __callback__ `{function(err, res)}` The callback function.

__Example__

```js
var repo = basreRepo(collection, schema);

repo.update({_id: '5108e9333cb086801f000035'}, {name: 'Litixsoft GmbH'}, function(err, res) {
    // weitere Logik
});

repo.update({_id: '5108e9333cb086801f000035'}, {$set: {name: 'Litixsoft GmbH', city: 'Palo Alto'}}, function(err, res) {
    // weitere Logik
});
```

---
### GridFs base repository



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