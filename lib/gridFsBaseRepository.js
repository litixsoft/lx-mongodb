'use strict';

var lxHelpers = require('lx-helpers');

/**
 * Returns a base repo.
 * @param {Object} schema
 * @param {!Object} collection The mongoDB collection.
 * @returns {Object|Error} The repo object.
 * @constructor
 */
module.exports = function (collection) {
    if (!collection || !lxHelpers.isObject(collection)) {
        throw new TypeError('Param "collection" is of type ' + lxHelpers.getType(collection) + '! Type ' + lxHelpers.getType({}) + ' expected');
    }

    var pub = {},
        ObjectID = require('mongodb').ObjectID;

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
     * @returns {{deleteUnknownProperties: boolean, convert: Function}}
     */
    pub.getValidationOptions = function () {
        return {
            deleteUnknownProperties: true,
            convert: convert
        };
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
     * Inserts a document to collection.
     *
     * @param {Object|function(err, res)} data The binary data to save.
     * @param {Object|function(err, res)} options The options for document.
     * @param {Function=} callback The callback.
     */
    pub.put = function (data, options, callback) {
        collection.getGridFs(function (error, coll) {
            if (error) {
                callback(error);
                return;
            }

            coll.put(data, options, callback);
        });
    };

    /**
     * Gets a document from collection.
     *
     * @param {Object|function(err, res)} id The mongo id from document.
     * @param {Function=} callback The callback.
     */
    pub.get = function (id, callback) {
        if (!id || (!(id instanceof ObjectID) && typeof id !== 'string')) {
            callback(new TypeError('Param "id" is of type ' + lxHelpers.getType(id) + '! Type ' + lxHelpers.getType({}) + ' or ' + lxHelpers.getType('') + ' expected'), null);
            return;
        }

        if (typeof id === 'string') {
            id = pub.convertId(id);
        }

        collection.getGridFs(function (error, coll) {
            if (error) {
                callback(error);
                return;
            }

            coll.get(id, callback);
        });
    };

    /**
     * Removes a document from collection.
     *
     * @param {Object|function(err, res)} id The mongo id from document.
     * @param {Function=} callback The callback.
     */
    pub.delete = function (id, callback) {
        if (!id || (!(id instanceof ObjectID) && typeof id !== 'string')) {
            callback(new TypeError('Param "id" is of type ' + lxHelpers.getType(id) + '! Type ' + lxHelpers.getType({}) + ' or ' + lxHelpers.getType('') + ' expected'), null);
            return;
        }

        if (typeof id === 'string') {
            id = pub.convertId(id);
        }

        collection.getGridFs(function (error, coll) {
            if (error) {
                callback(error);
                return;
            }

            coll.delete(id, callback);
        });
    };

    return pub;
};