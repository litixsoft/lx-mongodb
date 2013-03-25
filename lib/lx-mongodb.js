var mongoJs = require('mongojs'),
    dbs = {};

function getDbName(connectionString) {
    'use strict';

    var arr1 = connectionString.split('/');

    if (! arr1[1]) {
        throw new Error('No database in connection string');
    }

    var arr2 = arr1[1].split('?');
    return arr2[0];
}

exports.GetDb = function (connectionString, collections) {
    'use strict';

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

exports.BaseRepo = function (collection) {
    'use strict';

    if (! collection) {
        throw new Error('missing collection');
    }

    var defaultSortField = '_id',
        idField = '_id',
        pub = {},
        ObjectID = require('mongodb').ObjectID;

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
    function convertToMongoId(query) {
        if (query.hasOwnProperty(idField) && typeof query[idField] === 'string') {
            query[idField] = ObjectID.createFromHexString(query[idField]);
        }

        if (query.hasOwnProperty(idField) && query[idField].hasOwnProperty('$in')) {
            var i, max;
            for (i = 0, max = query[idField]['$in'].length; i < max; i += 1) {
                if (typeof query[idField]['$in'][i] === 'string') {
                    query[idField]['$in'][i] = ObjectID.createFromHexString(query[idField]['$in'][i]);
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
    function validate(doc, isUpdate, cb) {
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
    function queryTest(query) {

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
    function checkGetAllParameters(query, options, cb) {
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
     * createNewId
     * @returns {*}
     */
    pub.createNewId = function () {
        return new ObjectID();
    };

    /**
     * convertId
     * @param id
     * @returns {*}
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
     * getCount of collection
     * @param query
     * @param cb
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
     * create new document
     * @param doc
     * @param cb
     */
    pub.create = function (doc, cb) {

        if (arguments.length !== 2) {
            throw new Error('missing parameters');
        }

        if (typeof doc !== 'object') {
            throw new Error('document missing or not type object');
        }

        if (typeof  cb !== 'function') {
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
            }
            else {
                cb(null, res);
            }
        });
    };

    /**
     * GetAll documents
     * @param query
     * @param options
     * @param cb
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
            }
            else {
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
     * getOne document by query
     * @param query
     * @param options
     * @param cb
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
            }
            else {
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
     * getOneById document
     * @param id
     * @param options
     * @param cb
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
     * update documents of query
     * @param query
     * @param update
     * @param cb
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

        validate(doc, true, function (err, res) {
            if (err) {
                cb(err);
            } else if (res && res.valid) {

                if (typeof pub.convert !== 'undefined') {
                    doc = pub.convert(doc);
                }

                collection.update(query, doc, {safe: true}, cb);
            }
            else {
                cb(null, res);
            }
        });
    };

    /**
     * delete documents of query
     * @param query
     * @param justOne
     * @param cb
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
