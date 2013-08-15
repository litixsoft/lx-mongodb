'use strict';

var lxHelpers = require('lx-helpers');

/**
 * Returns a base repo.
 * @param {Object} schema
 * @param {!Object} collection The mongoDB collection.
 * @returns {Object|Error} The repo object.
 * @constructor
 */
module.exports = function (collection, schema) {
    if (!collection || !lxHelpers.isObject(collection)) {
        throw new TypeError('Param "collection" is of type ' + lxHelpers.getType(collection) + '! Type ' + lxHelpers.getType({}) + ' expected');
    }

    schema = schema || {};

    var pub = {},
        sort = {},
        idFields = {},
        tmp = {},
        key = '_id',
        ObjectID = require('mongodb').ObjectID;

    function checkProperty (name, prop) {
        if (prop.type === 'string' && prop.format === 'mongo-id') {
            if (!idFields.hasOwnProperty(name)) {
                idFields[name] = true;
            }
        }

        if (prop.sort) {
            sort[name] = prop.sort;
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
        query = query || {};

        lxHelpers.forEach(idFields, function (key) {
            if (query.hasOwnProperty(key) && typeof query[key] === 'string') {
                query[key] = ObjectID.createFromHexString(query[key]);
            }

            if (query.hasOwnProperty(key) && query[key] && query[key].hasOwnProperty('$in') && lxHelpers.isArray(query[key].$in)) {
                query[key].$in = lxHelpers.arrayMap(query[key].$in, function (item) {
                    if (typeof item === 'string') {
                        return ObjectID.createFromHexString(item);
                    }

                    if (lxHelpers.isObject(item)) {
                        return item;
                    }
                });
            }
        });

        return query;
    }

    /**
     * query tester
     * @param query
     * @returns {boolean}
     */
    function isOptions (query) {
        var isOption = false,
            checkArr = ['fields', 'sort', 'skip', 'limit'];

        lxHelpers.forEach(query, function (key) {
            if (checkArr.indexOf(key) > -1) {
                isOption = true;
                return;
            }
        });

        return isOption;
    }

    /**
     * checkParams
     * @param query
     * @param options
     * @param callback
     */
    function checkParams (options, callback) {
        if (!lxHelpers.isObject(options)) {
            throw new TypeError('Param "options" is of type ' + lxHelpers.getType(options) + '! Type ' + lxHelpers.getType({}) + ' expected');
        }

        if (!lxHelpers.isFunction(callback)) {
            throw new TypeError('Param "callback" is of type ' + lxHelpers.getType(callback) + '! Type ' + lxHelpers.getType(lxHelpers.getType) + ' expected');
        }
    }

    /**
     * Deletes the key of the document for update operation.
     *
     * @param {object=} document The document.
     */
    function deleteDocumentKey (document) {
        document = document || {};

        if (document.$set) {
            delete document.$set[key];
        } else {
            delete document[key];
        }
    }

    /**
     * Converts a value by format. Is used in lx-valid.
     *
     * @param {String} format The schema format.
     * @param {*} value The value to convert.
     * @returns {*}
     */
    function convert (format, value) {
        if (typeof value !== 'string') {
            return value;
        }

        if (format === 'mongo-id') {
            return ObjectID.createFromHexString(value);
        }

        if (format === 'date-time') {
            return new Date(value);
        }

        return value;
    }

    /**
     * Gets the sort option for mongoDB.
     *
     * @param {string|array|object} value The sort value.
     * @returns {*}
     */
    function getSort (value) {
        var result = {};

        // return default sort
        if (!value) {
            return sort;
        }

        // sort by the given string ascending, e.g. 'name'
        if (typeof value === 'string') {
            result[value] = 1;
            return result;
        }

        if (lxHelpers.isArray(value) && value.length > 0) {
            if (lxHelpers.isArray(value[0])) {
                // sort by array, e.g. [['name': 1], ['city': -1]]
                return value;
            } else {
                lxHelpers.forEach(value, function (item) {
                    if (typeof item === 'string') {
                        result[item] = 1;
                    }
                });

                // sort by the strings in the array ascending, e.g. ['name', 'city']
                return result;
            }
        }

        // sort by object, e.g. {name: 1, city: -1}
        if (lxHelpers.isObject(value)) {
            return value;
        }

        return null;
    }

    /**
     * Returns the schema of the collection.
     *
     * @returns {Object}
     */
    pub.getSchema = function () {
        return lxHelpers.isFunction(schema) ? schema.apply() : schema;
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
     * Returns the validation options for lx-valid.
     *
     * @returns {{deleteUnknownProperties: boolean, convert: Function, trim: boolean, strictRequired: boolean}}
     */
    pub.getValidationOptions = function () {
        return {
            // deletes all properties not defined in the json schema
            deleteUnknownProperties: true,
            // function to convert the values with a format to a value that mongoDb can handle (e.g dates, ObjectID)
            convert: convert,
            // trim all values which are in schema and of type 'string'
            trim: true,
            // handle empty string values as invalid when they are required in schema
            strictRequired: true
        };
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
        } else if (lxHelpers.isObject(id)) {
            id = id.toHexString();
        }

        return id;
    };

    /**
     * Gets the count of the collection.
     *
     * @param {Object|function(err, res)} query The query object or callback.
     * @param {Function=} callback The callback.
     */
    pub.getCount = function (query, callback) {
        if (arguments.length === 1) {
            callback = query;
            query = {};
        }

        if (!lxHelpers.isObject(query)) {
            callback(new TypeError('Param "query" is of type ' + lxHelpers.getType(query) + '! Type ' + lxHelpers.getType({}) + ' expected'), null);
            return;
        }

        query = convertToMongoId(query);

        collection.count(query, callback);
    };

    /**
     * Creates a new document in the db.
     *
     * @param {!Object|!Array} doc The document/s.
     * @param {!function(err, res)} callback The callback.
     */
    pub.create = function (doc, callback) {
        if (arguments.length !== 2) {
            throw new Error('missing parameters');
        }

        if (!(lxHelpers.isObject(doc) || lxHelpers.isArray(doc))) {
            callback(new TypeError('Param "doc" is of type ' + lxHelpers.getType(doc) + '! Type ' + lxHelpers.getType({}) + ' or ' + lxHelpers.getType([]) + ' expected'), null);
            return;
        }

        if (!lxHelpers.isFunction(callback)) {
            throw new TypeError('Param "callback" is of type ' + lxHelpers.getType(callback) + '! Type ' + lxHelpers.getType(lxHelpers.getType) + ' expected');
        }

        collection.insert(doc, {w: 1}, callback);
    };

    /**
     * Gets all documents of the collection.
     *
     * @param {Object|function(err, res)} query The query or the callback.
     * @param {Object|function(err, res)} options The options or the callback.
     * @param {Number} options.skip The skip param for mongoDB.
     * @param {Number} options.limit The limit param for mongoDB.
     * @param {array|object} options.fields The fields which returns from the query.
     * @param {string|array|object} options.sort The sort param for mongoDB.
     * @param {function(err, res)=} callback The callback.
     */
    pub.getAll = function (query, options, callback) {
        if (arguments.length === 1) {
            callback = query;
            query = {};
            options = {};
        }

        if (arguments.length === 2) {
            callback = options;

            if (isOptions(query)) {
                options = query;
                query = {};
            } else {
                options = {};
            }
        }

        checkParams(options, callback);

        if (!lxHelpers.isObject(query)) {
            callback(new TypeError('Param "query" is of type ' + lxHelpers.getType(query) + '! Type ' + lxHelpers.getType({}) + ' expected'), null);
            return;
        }

        var mongoOptions = {
            skip: options.skip || 0,
            limit: options.limit || 0,
            fields: options.fields,
            sort: getSort(options.sort)
        };

        query = convertToMongoId(query);

        collection.find(query, mongoOptions).toArray(callback);
    };

    /**
     * Gets one document by query
     *
     * @param {Object} query The query object.
     * @param {Number} options.skip The skip param for mongoDB.
     * @param {Number} options.limit The limit param for mongoDB.
     * @param {array|object} options.fields The fields which returns from the query.
     * @param {string|array|object} options.sort The sort param for mongoDB.
     * @param {Object|function(err, res)} options The options or the callback.
     * @param {function(err, res)=} callback The callback.
     */
    pub.getOne = function (query, options, callback) {
        if (arguments.length < 2) {
            throw new Error('missing parameters');
        }

        if (arguments.length === 2) {
            callback = options;

            if (isOptions(query)) {
                options = query;
                query = {};
            } else {
                options = {};
            }
        }

        checkParams(options, callback);

        if (!lxHelpers.isObject(query)) {
            callback(new TypeError('Param "query" is of type ' + lxHelpers.getType(query) + '! Type ' + lxHelpers.getType({}) + ' expected'), null);
            return;
        }

        var mongoOptions = {
            fields: options.fields,
            sort: getSort(options.sort)
        };

        query = convertToMongoId(query);
        collection.findOne(query, mongoOptions, callback);
    };

    /**
     * Gets one document by id
     * @param {ObjectID|String} id The id.
     * @param {Object|function(err, res)} options The options or the callback.
     * @param {array|object} options.fields The fields which returns from the query.
     * @param {function(err, res)=} callback The callback.
     */
    pub.getOneById = function (id, options, callback) {
        if (arguments.length < 2) {
            throw new Error('missing parameters');
        }

        if (arguments.length === 2) {
            callback = options;
            options = {};
        }

        if (!id || (!lxHelpers.isObject(id) && typeof id !== 'string')) {
            callback(new TypeError('Param "id" is of type ' + lxHelpers.getType(id) + '! Type ' + lxHelpers.getType({}) + ' or ' + lxHelpers.getType('') + ' expected'), null);
            return;
        }

        checkParams(options, callback);

        var mongoOptions = {
            fields: options.fields
        };

        var query = {};
        query[key] = id;
        query = convertToMongoId(query);

        collection.findOne(query, mongoOptions, callback);
    };

    /**
     * Updates the documents of the query.
     *
     * @param {!Object} query The query object.
     * @param {!Object} update The new data.
     * @param {!Object} options The options for multi update.
     * @param {!function(err, res)} callback The callback.
     */
    pub.update = function (query, update, options, callback) {
        if (arguments.length < 3) {
            throw new Error('missing parameters.');
        }

        if (arguments.length === 3) {
            callback = options;
            options = {};
        }

        query = convertToMongoId(query);

        // delete key property
        deleteDocumentKey(update);

        options = options || {};
        options.w = 1;

        collection.update(query, update, options, callback);
    };

    /**
     * Deletes the documents of the query.
     *
     * @param {!Object} query The query object.
     * @param {function(object, object)} callback The callback.
     */
    pub.delete = function (query, callback) {
        if (!lxHelpers.isObject(query)) {
            callback(new TypeError('Param "query" is of type ' + lxHelpers.getType(query) + '! Type ' + lxHelpers.getType({}) + ' expected'), null);
            return;
        }

        if (!lxHelpers.isFunction(callback)) {
            throw new TypeError('Param "callback" is of type ' + lxHelpers.getType(callback) + '! Type ' + lxHelpers.getType(lxHelpers.getType) + ' expected');
        }

        query = convertToMongoId(query);
        collection.remove(query, {w: 1}, callback);
    };

    /**
     * Execute an aggregation framework pipeline against the collection.
     *
     * @param {Array} pipeline The aggregation framework pipeline.
     * @param {Object=} options The additional options.
     * @param {function(err, res)} callback The callback.
     */
    pub.aggregate = function (pipeline, options, callback) {
        if (arguments.length < 2) {
            throw new Error('missing callback parameter');
        }

        if (arguments.length === 2) {
            callback = options;
            options = {};
        }

        if (!lxHelpers.isArray(pipeline)) {
            callback(new TypeError('Param "pipeline" is of type ' + lxHelpers.getType(pipeline) + '! Type ' + lxHelpers.getType([]) + ' expected'), null);
            return;
        }

        options = options || {};

        collection.aggregate(pipeline, options, callback);
    };

    var tmpSchema = pub.getSchema();

    if (tmpSchema.hasOwnProperty('properties')) {
        analyseSchema(tmpSchema.properties);
    } else {
        analyseSchema(tmpSchema);
    }

    // set default sorting
    if (Object.keys(sort).length === 0) {
        sort[key] = 1;
    }

    return pub;
};