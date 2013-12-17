'use strict';

var mongoJs = require('mongojs'),
    lxHelpers = require('lx-helpers'),
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
    // check args
    if (typeof connectionString !== 'string') {
        throw lxHelpers.getTypeError('connectionString', connectionString, '');
    }

    if ((arguments.length === 2 && !lxHelpers.isArray(collections)) ||
        (arguments.length === 3 && !lxHelpers.isArray(collections) && !lxHelpers.isArray(gridFsCollections))) {
        throw lxHelpers.getTypeError('collections', collections, []);
    }

    if (arguments.length === 1) {
        collections = [];
    }

    if (dbs.hasOwnProperty(connectionString)) {
        // use db reference from cache
        var db = dbs[connectionString];

        // check if all collections are loaded
        lxHelpers.forEach(collections, function (collectionName) {
            if (db[collectionName]) {
                return;
            }

            // handle chained collections
            var parts = collectionName.split('.');
            var last = parts.pop();

            var parent = parts.reduce(function (parent, prefix) {
                parent[prefix] = parent[prefix] || {};
                return parent[prefix];
            }, db);

            // load collection if not already loaded
            if (!parent[last]) {
                parent[last] = db.collection(collectionName);
            }
        });

        return db;
    }

    dbs[connectionString] = mongoJs(connectionString, collections, gridFsCollections);

    return dbs[connectionString];
};

exports.BaseRepo = require('./baseRepository.js');
exports.GridFsBaseRepo = require('./gridFsBaseRepository.js');