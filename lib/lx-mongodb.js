'use strict';

var mongoJs = require('mongojs');
var dbs = {};
var UpdateCommand = require('./updateCommand.js').UpdateCommand;

/**
 * Returns the name of the db from the connection string.
 *
 * @param {!String} connectionString The db connection string.
 * @returns {String|Error}
 */
function getDbName (connectionString) {
    var arr1 = connectionString.split('/');

    if (!arr1[1]) {
        throw new Error('No database in connection string');
    }

    var arr2 = arr1[1].split('?');

    return arr2[0];
}

/**
 * Returns a mongo db.
 *
 * @param {!String} connectionString The connection string.
 * @param {Array=} collections The array with the collections to load.
 * @returns {*}
 * @constructor
 */
exports.GetDb = function (connectionString, collections) {
    var dbName;

    if (typeof connectionString !== 'string') {
        throw new Error('uri missing or not type string');
    }

    if (arguments.length === 2 && !Array.isArray(collections)) {
        throw new Error('collections must be of array type');
    }

    if (arguments.length === 1) {
        collections = [];
    }

    dbName = getDbName(connectionString);

    if (dbs.hasOwnProperty(dbName)) {
        return dbs[dbName];
    }

    dbs[dbName] = mongoJs(connectionString, collections);

    return dbs[dbName];
};

/**
 * Returns a base repo.
 *
 * @param {!Object} collection The mongoDB collection.
 * @returns {Object|Error} The repo object.
 * @constructor
 */
exports.BaseRepo = function (collection) {
    if (!collection) {
        throw new Error('missing collection');
    }

    var defaultSortField = '_id';
    var idField = '_id';
    var pub = {};
    var ObjectID = require('mongodb').ObjectID;

    pub.getCollection = function () {
        return collection;
    };

    pub.setDefaultSortField = function (defaultSortFieldName) {
        if (typeof defaultSortFieldName !== 'string') {
            throw new Error('defaultSortFieldName must be of string type');
        }

        defaultSortField = defaultSortFieldName;
    };

    pub.getDefaultSortFieldName = function () {
        return defaultSortField;
    };

    pub.setIdField = function (idFieldName) {
        if (typeof idFieldName !== 'string') {
            throw new Error('idFieldName must be of string type');
        }

        idField = idFieldName;
    };

    pub.getIdFieldName = function () {
        return idField;
    };

    /**
     * convert id to mongoId
     * @param query
     * @return {*}
     */
    function convertToMongoId (query) {
        if (query.hasOwnProperty(idField) && typeof query[idField] === 'string') {
            query[idField] = ObjectID.createFromHexString(query[idField]);
        }

        if (query.hasOwnProperty(idField) && query[idField].hasOwnProperty('$in')) {
            var i, max;

            for (i = 0, max = query[idField].$in.length; i < max; i += 1) {
                if (typeof query[idField].$in[i] === 'string') {
                    query[idField].$in[i] = ObjectID.createFromHexString(query[idField].$in[i]);
                }
            }
        }

        return query;
    }

    /**
     * validate update und create
     * @param doc
     * @param isUpdate
     * @param cb
     */
    function validate (doc, isUpdate, cb) {
        if (typeof pub.validate !== 'undefined') {
            var tmpSchema = JSON.parse(JSON.stringify(pub.getSchema()));
            pub.validate(doc, isUpdate, tmpSchema, cb);
        }
        else {
            cb(null, {valid: true});
        }
    }

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

        validate(doc, false, function (err, res) {
            if (err) {
                cb(err);
            } else if (res && res.valid) {
                if (typeof pub.convert !== 'undefined') {
                    doc = pub.convert(doc);
                }

                collection.insert(doc, {safe: true}, cb);
            } else {
                cb(null, res);
            }
        });
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

        if (!options.hasOwnProperty('projection')) {
            options.projection = {};
        }

        if (!options.hasOwnProperty('sortBy')) {
            options.sortBy = defaultSortField;
        }

        if (!options.hasOwnProperty('sort')) {
            options.sort = 1;
        }

        if (!options.hasOwnProperty('skip')) {
            options.skip = 0;
        }

        if (!options.hasOwnProperty('limit')) {
            options.limit = 0;
        }

        query = convertToMongoId(query);

        collection.find(query, options.projection).sort(options.sortBy, options.sort)
            .skip(options.skip).limit(options.limit).toArray(cb);
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

        if (!options.hasOwnProperty('projection')) {
            options.projection = {};
        }

        query = convertToMongoId(query);
        collection.findOne(query, options.projection, cb);
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

        if (!options.hasOwnProperty('projection')) {
            options.projection = {};
        }

        var query = {};
        query[idField] = id;
        query = convertToMongoId(query);

        collection.findOne(query, options.projection, cb);
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
        delete doc[idField];

        validate(doc, true, function (err, res) {
            if (err) {
                cb(err);
            } else if (res && res.valid) {
                if (typeof pub.convert !== 'undefined') {
                    doc = pub.convert(doc);
                }

                var updateCommand;

                if (!(doc instanceof UpdateCommand)) {
                    updateCommand = new UpdateCommand();
                    updateCommand.setValues(doc);
                } else {
                    updateCommand = doc;
                }

                collection.update(query, updateCommand.getUpdateCommands(), {safe: true}, cb);
            } else {
                cb(null, res);
            }
        });
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

    return pub;
};
