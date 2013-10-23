'use strict';

var mongoJs = require('mongojs'),
    dbs = {};

/**
 * Returns a mongo db.
 *
 * @param {!String} connectionString The connection string.
 * @param {Array=} collections The array with the collections to load.
 * @param {Array=} gridFsCollections The array with the gridFs collections to load.
 * @returns {*}
 * @constructor
 */
exports.GetDb = function (connectionString, collections, gridFsCollections) {
    if (typeof connectionString !== 'string') {
        throw new Error('uri missing or not type string');
    }

    if ((arguments.length === 2 && !Array.isArray(collections)) ||
        (arguments.length === 3 && !Array.isArray(collections) && !Array.isArray(gridFsCollections))) {
        throw new Error('collections must be of array type');
    }

    if (arguments.length === 1) {
        collections = [];
    }

    if (dbs.hasOwnProperty(connectionString)) {
        return dbs[connectionString];
    }

    dbs[connectionString] = mongoJs(connectionString, collections, gridFsCollections);

    return dbs[connectionString];
};

exports.BaseRepo = require('./baseRepository.js');
exports.GridFsBaseRepo = require('./gridFsBaseRepository.js');