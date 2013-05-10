'use strict';

var mongoJs = require('mongojs');
var dbs = {};

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

exports.BaseRepo = require('./baseRepository.js');
