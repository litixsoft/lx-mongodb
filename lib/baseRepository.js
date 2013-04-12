'use strict';

/**
 * Returns a base repo.
 * @param {Object} schema
 * @param {!Object} collection The mongoDB collection.
 * @returns {Object|Error} The repo object.
 * @constructor
 */
exports.BaseRepo = function (collection, schema) {
    if (!collection || typeof collection !== 'object') {
        throw new Error('collection must be of object type');
    }

    schema = schema || {};

    var tmp = {};
    var sort = {};
    var key = '_id';
    var idFields = {};
    var pub = {};
    var ObjectID = require('mongodb').ObjectID;

    function checkProperty (name, prop) {
        if (prop.type === 'string' && prop.format === 'mongo-id') {
            if (!idFields.hasOwnProperty(name)) {
                idFields[name] = true;
            }
        }

        if (prop.sort) {
            sort = {
                sortBy: name,
                direction: prop.sort
            };
        }

        if (prop.key) {
            key = name;
        }
    }

    function analyseSchema (schema) {
        for (var prop in schema) {
            if (schema.hasOwnProperty(prop)) {
                if (schema[prop].hasOwnProperty('properties')) {
                    tmp[prop] = true;
                    analyseSchema(schema[prop].properties);
                }

                else if (schema[prop].hasOwnProperty('items')) {
                    tmp[prop] = true;
                    analyseSchema(schema[prop].items.properties);
                }

                if (!tmp.hasOwnProperty(prop)) {
                    checkProperty(prop, schema[prop]);
                }
            }
        }
    }

    /**
     * convert id to mongoId
     * @param query
     * @return {*}
     */
    function convertToMongoId (query) {
        var i, max;

        for (var prop in idFields) {
            if (idFields.hasOwnProperty(prop)) {
                if (query.hasOwnProperty(prop) && typeof query[prop] === 'string') {
                    query[prop] = ObjectID.createFromHexString(query[prop]);
                }

                if (query.hasOwnProperty(prop) && query[prop].hasOwnProperty('$in')) {
                    for (i = 0, max = query[prop].$in.length; i < max; i += 1) {
                        if (typeof query[prop].$in[i] === 'string') {
                            query[prop].$in[i] = ObjectID.createFromHexString(query[prop].$in[i]);
                        }
                    }
                }
            }
        }

        return query;
    }

//    /**
//     * validate update und create
//     * @param doc
//     * @param isUpdate
//     * @param cb
//     */
//    function validate (doc, isUpdate, cb) {
//        if (typeof pub.validate !== 'undefined') {
//            var tmpSchema = JSON.parse(JSON.stringify(schema));
//            pub.validate(doc, isUpdate, tmpSchema, cb);
//        }
//        else {
//            cb(null, {valid: true});
//        }
//    }

    /**
     * query tester
     * @param query
     * @returns {boolean}
     */
    function queryTest (query) {

        var isOptions = false,
            checkArr = ['projection', 'sortBy', 'sort', 'skip', 'limit'],
            i, max;

        for (var prop in query) {
            if (query.hasOwnProperty(prop)) {
                for (i = 0, max = checkArr.length; i < max; i += 1) {
                    if (prop === checkArr[i]) {
                        isOptions = true;
                        break;
                    }
                }
            }
        }

        return isOptions;
    }

    /**
     * checkGetAllParameters
     * @param query
     * @param options
     * @param cb
     */
    function checkGetAllParameters (query, options, cb) {
        if (typeof query !== 'object') {
            throw new Error('query must be of object type');
        }

        if (typeof options !== 'object') {
            throw new Error('options must be of object type');
        }

        if (typeof cb !== 'function') {
            throw new Error('callback must be of function type');
        }
    }

    /**
     * Returns the schema of the collection.
     *
     * @returns {Object}
     */
    pub.getSchema = function () {
        return typeof schema === 'function' ? schema.apply() : schema;
    };

    /**
     * Returns the collection.
     *
     * @returns {!Object}
     */
    pub.getCollection = function () {
        return collection;
    };

    /**
     * Creates a new mongo ObjectID
     *
     * @returns {ObjectID}
     */
    pub.createNewId = function () {
        return new ObjectID();
    };

    /**
     * Converts a string in a mongo ObjectID and vice versa.
     *
     * @param {String|ObjectID} id The id to convert.
     * @returns {String|ObjectID}
     */
    pub.convertId = function (id) {
        if (typeof id === 'string') {
            id = ObjectID.createFromHexString(id);
        }
        else if (typeof id === 'object') {
            id = id.toHexString();
        }

        return id;
    };

    /**
     * Gets the count of the collection.
     *
     * @param {Object|function(err, res)} query The query object or callback.
     * @param {Function=} cb The callback.
     */
    pub.getCount = function (query, cb) {
        if (arguments.length === 1) {
            cb = query;
            query = {};
        }

        query = convertToMongoId(query);

        collection.find(query).count(cb);
    };

    /**
     * Creates a new document in the db.
     *
     * @param {!Object} doc The document.
     * @param {!function(err, res)} cb The callback.
     */
    pub.create = function (doc, cb) {
        if (arguments.length !== 2) {
            throw new Error('missing parameters');
        }

        if (typeof doc !== 'object') {
            throw new Error('document missing or not type object');
        }

        if (typeof cb !== 'function') {
            throw new Error('callback is not an function');
        }

        collection.insert(doc, {safe: true}, cb);
    };

    /**
     * Gets all documents of the collection.
     *
     * @param {Object|function(err, res)} query The query or the callback.
     * @param {Object|function(err, res)} options The options or the callback.
     * @param {function(err, res)=} cb The callback.
     */
    pub.getAll = function (query, options, cb) {
        if (arguments.length === 1) {
            cb = query;
            query = {};
            options = {};
        }

        if (arguments.length === 2) {
            cb = options;

            if (queryTest(query)) {
                options = query;
                query = {};
            } else {
                options = {};
            }
        }

        checkGetAllParameters(query, options, cb);

        var mongoOptions = {
            skip: options.skip || 0,
            limit: options.limit || 0,
            fields: options.fields,
            sort: [
                [options.sortBy || sort.sortBy, options.sort || sort.direction]
            ]
        };

        query = convertToMongoId(query);

        collection.find(query, mongoOptions).toArray(cb);
    };

    /**
     * Gets one document by query
     *
     * @param {Object} query The query object.
     * @param {Object|function(err, res)} options The options or the callback.
     * @param {function(err, res)=} cb The callback.
     */
    pub.getOne = function (query, options, cb) {
        if (arguments.length < 2) {
            throw new Error('missing parameters');
        }

        if (arguments.length === 2) {
            cb = options;

            if (queryTest(query)) {
                options = query;
                query = {};
            } else {
                options = {};
            }
        }

        checkGetAllParameters(query, options, cb);

        var mongoOptions = {
            fields: options.fields,
            sort: [
                [options.sortBy || sort.sortBy, options.sort || sort.direction]
            ]
        };

        query = convertToMongoId(query);
        collection.findOne(query, mongoOptions, cb);
    };

    /**
     * Gets one document by id
     * @param {ObjectID|String} id The id.
     * @param {Object|function(err, res)} options The options or the callback.
     * @param {function(err, res)=} cb The callback.
     */
    pub.getOneById = function (id, options, cb) {
        if (arguments.length < 2) {
            throw new Error('missing parameters');
        }

        if (arguments.length === 2) {
            cb = options;
            options = {};
        }

        if (typeof id !== 'object' && typeof id !== 'string') {
            throw new Error('id must be of string or object type');
        }

        if (typeof options !== 'object') {
            throw new Error('options must be of object type');
        }

        if (typeof cb !== 'function') {
            throw new Error('callback must be of function type');
        }

        var mongoOptions = {
            fields: options.fields
        };

        var query = {};
        query[key] = id;
        query = convertToMongoId(query);

        collection.findOne(query, mongoOptions, cb);
    };

    /**
     * Updates the documents of the query.
     *
     * @param {!Object} query The query object.
     * @param {!Object} update The new data.
     * @param {!function(err, res)} cb The callback.
     */
    pub.update = function (query, update, cb) {
        if (arguments.length < 3) {
            throw new Error('missing parameters.');
        }

        query = convertToMongoId(query);
        var doc = {};

        for (var prop in update) {
            if (update.hasOwnProperty(prop)) {
                doc[prop] = update[prop];
            }
        }

        // delete id property
        delete doc[key];

        collection.update(query, doc, {safe: true}, cb);
    };

    /**
     * Deletes the documents of the query.
     *
     * @param {!Object} query The query object.
     * @param {Boolean|function(err, res)} justOne Indicates if just one document is deleted or not.
     * @param {function(err, res)=} cb The callback.
     */
    pub.delete = function (query, justOne, cb) {
        if (arguments.length < 2) {
            throw new Error('missing parameters');
        }

        if (arguments.length === 2) {
            if (typeof query !== 'object') {
                throw new Error('query must be of object type');
            }

            if (typeof justOne !== 'function') {
                throw new Error('missing callback');
            }

            cb = justOne;
            justOne = false;
        }

        if (arguments.length === 3) {
            if (typeof query !== 'object') {
                throw new Error('query must be of object type');
            }

            if (typeof justOne !== 'boolean') {
                throw new Error('justOne must be of boolean type');
            }

            if (typeof cb !== 'function') {
                throw new Error('missing callback');
            }
        }

        query = convertToMongoId(query);
        collection.remove(query, justOne, cb);
    };

    var tmpSchema = pub.getSchema();

    if (tmpSchema.hasOwnProperty('properties')) {
        analyseSchema(tmpSchema.properties);
    } else {
        analyseSchema(tmpSchema);
    }

    if (!sort.sortBy) {
        sort = {
            sortBy: key,
            direction: 1
        };
    }

    return pub;
};