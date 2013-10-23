# lx-mongodb [![Build Status](https://travis-ci.org/litixsoft/lx-mongodb.png?branch=master)](https://travis-ci.org/litixsoft/lx-mongodb) [![david-dm](https://david-dm.org/litixsoft/lx-mongodb.png)](https://david-dm.org/litixsoft/lx-mongodb/) [![david-dm](https://david-dm.org/litixsoft/lx-mongodb/dev-status.png)](https://david-dm.org/litixsoft/lx-mongodb#info=devDependencies&view=table)

Litixsoft backend driver for mongoDb based on mongojs.

## Install:
[![NPM](https://nodei.co/npm/lx-mongodb.png??downloads=true&stars=true)](https://nodei.co/npm/lx-mongodb/)

## Documentation
[http://www.litixsoft.de/products-lxmongodb.html](http://www.litixsoft.de/products-lxmongodb.html) (german)

## Examples
### Simple query
```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost/blog?w=1&journal=True&fsync=True', ['users']),
    repo = lxDb.BaseRepo(db.users);

// get all users
repo.getAll(function(error, result) {
	console.log(result);
});

// add user
repo.create({name: 'wayne', age: 99}, function(error, result) {
	console.log(result);
});
```

### Simple repository with JSON schema
```js
var lxDb = require('lx-mongodb');

exports.UserRepository = function (collection) {
    var schema = function () {
            return {
                properties: {
                    _id: {
                        type: 'string',
                        required: false,
                        format: 'mongo-id',
                        key: true
                    },
                    email: {
                        type: 'string',
                        required: true,
                        format: 'email'
                    },
                    userName: {
                        type: 'string',
                        required: true,
                        sort: 1
                    }
                }
            };
        },
        baseRepo = lxDb.BaseRepo(collection, schema);

    return baseRepo;
};
```
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
```js
var lxDb = require('lx-mongodb');

exports.UserRepository = function (collection) {
    var schema = function () {
            return {
                properties: {
                    _id: {
                        type: 'string',
                        required: false,
                        format: 'mongo-id',
                        key: true
                    },
                    email: {
                        type: 'string',
                        required: true,
                        format: 'email'
                    },
                    userName: {
                        type: 'string',
                        required: true,
                        sort: 1
                    },
                    birthdate: {
                        type: 'string',
                        required: true,
                        format: 'date-time'
                    },
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
### Database connection
* [getDb](#getDb)

### Base repository

* [BaseRepository](#BaseRepository)
* [aggregate](#aggregate)
* [createNewId](#createNewId)
* [convertId](#convertId)
* [create](#create)
* [delete](#BaseRepository)
* [getAll](#getAll)
* [getCollection](#getCollection)
* [getCount](#getCount)
* [getOne](#getOne)
* [getOneById](#getOneById)
* [getSchema](#getSchema)
* [getValidationOptions](#getValidationOptions)
* [update](#update)

### Gridfs base repository

* [GridFsBaseRepo](#GridFsBaseRepo)
* [convertId](#convertId1)
* [delete](#delete1)
* [get](#get)
* [getCollection](#getCollection1)
* [getValidationOptions](#getValidationOptions1)
* [put](#put)

### Database connection

<a name="getDb" />
#### getDb(connectionString, collections, gridFsCollections)
Creates a connection to the mongoDb using a connection string. The db and the connections are stored in memory.

*Note: When querying the metadata of gridFsCollections, you need to add them to the collections array. See examples.*

__Arguments__

* __connectionString__ `{!string}` - The connection string.
* __collections__ `{!Array.<string>}` - The names of the mongo collections.
* __gridFsCollections__ `{Array.<string>=}` - The names of the gridfs collections.

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

* __collection__ `{!Object}` - The mongoDb colllection.
* __schema__ `{(Object|Function)=}` - The JSON schema. Is used to get the id field and the default sorting.

```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['posts', 'tags', 'comments']),
    postRepo = lxDb.BaseRepo(db.posts);
```
--

<a name="aggregate" />
#### aggregate(pipeline, options, callback)
Execute an aggregation framework pipeline against the collection, needs MongoDB >= 2.1.

__Arguments__

* __pipeline__ `{!Array}` - The aggregation framework pipeline.
* __options__ `{Object=}` - The additional options.
* __callback__ `{function(err, res)}` - The callback function.

```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['users']),
    repo = lxDb.BaseRepo(db.users),
    pipeline = [
        {$project: {age: 1}},
        {$group: {_id: {age: '$age'}, count: { $sum: 1}}},
        {$project: {_id: '$_id', age: '$age', count: '$count'}}
    ];

    repo.aggregate(pipeline, {}, function(error, result) {
        // more logic here
    });
```
--

<a name="createNewId" />
#### createNewId()
Returns a new mongo ObjectId.

```js
var repo = BaseRepo(collection, schema),
    _id = repo.createNewId();

_id instanceof ObjectID === true; // true
```
--

<a name="convertId" />
#### convertId(id)
Converts a `string` to a mongo `ObjectID` and vice versa.

__Arguments__

* __id__ `{Object|string}` - The id to convert.

```js
var repo = BaseRepo(collection, schema),
    _id = repo.createNewId(),
    idString = repo.convertId(_id);

typeof idString === 'string'; // true
```
--

<a name="create" />
#### create(doc, callback)
Creates one or more records in the mongoDb.

__Arguments__

* __doc__ `{Array|Object}` - The data.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema);

repo.create({name: 'Litixsoft', city: 'Leipzig'}, function(err, res) {
    // more logic here
});
```
--

<a name="delete" />
#### delete(query, callback)
Deletes one or more records in the mongoDb.

__Arguments__

* __query__ `{Object}` - The query.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema);

repo.delete({_id: '5108e9333cb086801f000035'}, function(err, res) {
    // more logic here
});

repo.delete({city: 'Berlin'}, function(err, res) {
    // more logic here
});
```
--

<a name="getAll" />
#### getAll(query, options, callback)
Gets the records from the mongoDb.

__Arguments__

* __query__ `{Object=}` - The query.
* __options__ `{Object=}` - The mongoDb query options.
* __options.fields__ `{(Array|Object)=}` - The fields which should be returned by the query.
* __options.limit__ `{Number=}` - The number of records which should be returned by the query.
* __options.skip__ `{Number=}`- The number of records which should be skipped by the query.
* __options.sort__ `{(Array|String|Object)=}` - The sorting of the returned records.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema);

repo.getAll({}, function(err, res) {
    // more logic here
});

repo.getAll({name: 'Litixsoft'}, {skip: 0, limit: 10, sort: {name: 1}, fields: ['name', 'city']}, function(err, res) {
    // more logic here
});
```
--

<a name="getCollection" />
#### getCollection()
Returns the mongoDb collection object.

```js
var repo = BaseRepo(collection, schema),
    myCollection = repo.getCollection();

collection == myCollection; // true
```
--

<a name="getCount" />
#### getCount(query, callback)
Returns the number of records.

__Arguments__

* __query__ `{Object}` - The query.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema);

repo.getCount({}, function(err, res) {
    // more logic here
});
```
--

<a name="getOne" />
#### getOne(query, options, callback)
Gets one record from the mongoDb.

__Arguments__

* __query__ `{Object=}` - The query.
* __options__ `{Object=}` - The mongoDb query options.
* __options.fields__ `{(Array|Object)=}` - The fields which should be returned by the query.
* __options.limit__ `{Number=}` - The number of records which should be returned by the query.
* __options.skip__ `{Number=}`- The number of records which should be skipped by the query.
* __options.sort__ `{(Array|String|Object)=}` - The sorting of the returned records.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema);

repo.getOne({name: 'Litixsoft'}, function(err, res) {
    // more logic here
});

repo.getOne({name: 'Litixsoft'}, {skip: 0, limit: 10, sort: {name: 1}, fields: ['name', 'city']}, function(err, res) {
    // more logic here
});
```
--

<a name="getOneById" />
#### getOneById(id, options, callback)
Gets one record by id from the mongoDb.

__Arguments__

* __id__ `{Object|string}` - The id.
* __options__ `{Object=}` - The mongoDb query options.
* __options.fields__ `{(Array|Object)=}` - The fields which should be returned by the query.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema),
    myId = repo.convertId('5108e9333cb086801f000035');

repo.getOneById('5108e9333cb086801f000035', function(err, res) {
    // more logic here
});

repo.getOneById(myId, {fields: ['name', 'city']}, function(err, res) {
    // more logic here
});
```
--

<a name="getSchema" />
#### getSchema()
Returns the JSON schema.

```js
var repo = BaseRepo(collection, schema),
    mySchema = repo.getSchema();

schema == mySchema; // true
```
--

<a name="getValidationOptions" />
#### getValidationOptions()
Returns an object with the validation options. This is especially useful in combination with [lx-valid](https://github.com/litixsoft/lx-valid).
The method `convert()` can also be used by other schema validators.

```js
var repo = BaseRepo(collection, schema),
    options = repo.getValidationOptions();

options.deleteUnknownProperties === true; // true
typeof options.convert === 'function'; // true
```
--

<a name="update" />
#### update(query, update, options, callback)
Updates one or more records in the mongoDb.

__Arguments__

* __query__ `{Object}` - The query.
* __update__ `{Object}` - The data to update.
* __options__ `{Object=}` - The options for multi update.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = BaseRepo(collection, schema);

repo.update({_id: '5108e9333cb086801f000035'}, {name: 'Litixsoft GmbH'}, function(err, res) {
    // more logic here
});

repo.update({_id: '5108e9333cb086801f000035'}, {$set: {name: 'Litixsoft GmbH', city: 'Palo Alto'}}, function(err, res) {
    // more logic here
});

repo.update({}, {$set: {name: 'Litixsoft GmbH', city: 'Palo Alto'}}, {multi: true}, function(err, res) {
    // more logic here
});
```
---

### GridFs base repository

<a name="GridFsBaseRepo" />
#### GridFsBaseRepo(collection)
Creates a new repository with the base mongoDb gridfs operations.

__Arguments__

* __collection__ `{!Object}` - The mongoDb gridfs colllection.

```js
var lxDb = require('lx-mongodb'),
    db = lxDb.GetDb('localhost:27017/blog?w=0&journal=True&fsync=True', ['posts', 'tags', 'comments'], ['documents']),
    documentsRepo = lxDb.GridFsBaseRepo(db.documents);
```
--

<a name="convertId1" />
#### convertId(id)
Converts a `string` to a mongo `ObjectID` and vice versa.

__Arguments__

* __id__ `{Object|string}` - The id to convert.

```js
var repo = GridFsBaseRepo(collection),
    _id = repo.createNewId(),
    idString = repo.convertId(_id);

typeof idString === 'string'; // true
```
--

<a name="delete1" />
#### delete(id, callback)
Deletes a file from the collection.

__Arguments__

* __id__ `{Object|string}` - The id of the file.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = GridFsBaseRepo(collection);

repo.delete('5108e9333cb086801f000035', function(err, res) {
    // more logic here
});
```
--

<a name="get" />
#### get(id, callback)
Gets a file from the collection.

__Arguments__

* __id__ `{Object|string}` - The id of the file.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = GridFsBaseRepo(collection);

repo.get('5108e9333cb086801f000035', function(err, res) {
    // more logic here
});
```
--

<a name="getCollection1" />
#### getCollection()
Returns the mongoDb gridfs collection object.

```js
var repo = GridFsBaseRepo(collection),
    myCollection = repo.getCollection();

collection == myCollection; // true
```
--

<a name="getValidationOptions1" />
#### getValidationOptions()
Returns an object with the validation options. This is especially useful in combination with [lx-valid](https://github.com/litixsoft/lx-valid).
The method `convert()` can also be used by other schema validators.

```js
var repo = GridFsBaseRepo(collection),
    options = repo.getValidationOptions();

options.deleteUnknownProperties === true; // true
options.trim === true; // true
options.strictRequired === true; // true
typeof options.convert === 'function'; // true
```
--

<a name="put" />
#### put(data, options, callback)
Inserts a file to the collection.

__Arguments__

* __data__ `{Object}` - The buffer with the binary data of the file.
* __options__ `{Object}` - The options for the file.
* __callback__ `{function(err, res)}` - The callback function.

```js
var repo = GridFsBaseRepo(collection);

repo.put(new Buffer('Litixsoft'), {metadata: {'type': 'string'}}, function(err, res) {
    // more logic here
});
```

## Contributing
In lieu of a formal styleguide take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

## Release History
### v0.4.6
* refactor caching of database connection, connections are now cached by connectionString

### v0.4.5
* also convert data that is of type 'string' and format 'date' in the convert function

### v0.4.4
* add 'trim' and 'strictRequired' to the validationOptions

### v0.4.3
* add option for multi update in update function in BaseRepo

### v0.4.2
* add function aggregate(pipeline, options, callback) to BaseRepo

### v0.4.1
* refactored gridFs

### v0.4.0
* add api documentation

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