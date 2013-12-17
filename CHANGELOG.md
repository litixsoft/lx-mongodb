<a name="v0.5.2"></a>
### v0.5.2 (2013-12-17)


#### Features

* add collection to db object when db object is loaded from cache and the collecti ([495a129b](https://github.com/litixsoft/lx-mongodb/commit/495a129bb5f8cb33ffc059e57aa4f0872dd85033))

## v0.5.1
* set dependency mongodb to v1.3.19 since there is an error with v1.3.20

## v0.5.0
* rename some functions to match the mongo driver names (find, findOne, insert, remove, count)
* create an index when a property in the schema has the setting index: true
* create an unique index when a property in the schema has the setting unique: true
* add .jshintrc to store the jshint settings

## v0.4.7
* update url to mongojs dependency

## v0.4.6
* refactor caching of database connection, connections are now cached by connectionString

## v0.4.5
* also convert data that is of type 'string' and format 'date' in the convert function

## v0.4.4
* add 'trim' and 'strictRequired' to the validationOptions

## v0.4.3
* add option for multi update in update function in BaseRepo

## v0.4.2
* add function aggregate(pipeline, options, callback) to BaseRepo

## v0.4.1
* refactored gridFs

## v0.4.0
* add api documentation

## v0.3.4
* add gridFs error handling

## v0.3.3
* gridFs implemented with mongojs

## v0.3.2
* fix error in function create(), now also arrays can be passed as doc

## v0.3.1
* fix error in function convertToMongoId(), $in array with mongoId's was not identified correctly

## v0.3.0
* update lx-helpers
* refactor to take advantage of the new type checking in lxHelpers
* refactor sort option, it can be now a string, array or object

## v0.2.6
* refactor some param checks to callback with an TypeError instead of throwing an exception

## v0.2.5
* refactor baseRepo.delete()
* update tests
* change deprecated mongo option {safe: true} to {w: 1}

## v0.2.4
* callback with TypeError in getById() when id is null or undefined

## v0.2.3
* change some Errors to TypeErrors
* callback with TypeError in getById() when id is of wrong type

## v0.0.1 project initial