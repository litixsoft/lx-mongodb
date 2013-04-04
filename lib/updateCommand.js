'use strict';

/**
 * Returns an UpdateCommand.
 *
 * @returns {Object}
 * @constructor
 */
exports.UpdateCommand = function () {
    var pub = {};
    var updateCommands = {};

    /**
     * Gets the updateCommands.
     *
     * @returns {Object}
     */
    pub.getUpdateCommands = function () {
        return updateCommands;
    };

    /**
     * Sets a single value to the document.
     *
     * @param {String} key The key.
     * @param {*} value The value.
     */
    pub.setValue = function (key, value) {
        if (!key) {
            return;
        }

        if (typeof key !== 'string') {
            throw new Error('value must be of type string');
        }

        updateCommands.$set = updateCommands.$set || {};
        updateCommands.$set[key] = value;
    };

    /**
     * Sets the values to the document.
     *
     * @param {Object} values The data object.
     */
    pub.setValues = function (values) {
        if (!values) {
            return;
        }

        if (typeof values !== 'object') {
            throw new Error('value must be of type object');
        }

        updateCommands.$set = updateCommands.$set || {};
        var key;

        for (key in values) {
            if (values.hasOwnProperty(key)) {
                updateCommands.$set[key] = values[key];
            }
        }
    };

    /**
     * Deletes a single value from the document.
     *
     * @param {String} key The key.
     */
    pub.deleteKey = function (key) {
        if (!key) {
            return;
        }

        if (typeof key !== 'string') {
            throw new Error('value must be of type string');
        }

        updateCommands.$unset = updateCommands.$unset || {};
        updateCommands.$unset[key] = 1;
    };

    /**
     * Increments a single value in the document.
     * If value is not set, value is set to 1.
     *
     * @param {String} key The key.
     * @param {number=} value The value how much to increment.
     */
    pub.incrementValue = function (key, value) {
        if (!key) {
            return;
        }

        if (typeof key !== 'string') {
            throw new Error('value must be of type string');
        }

        value = value || 1;

        if (typeof value !== 'number') {
            throw new Error('value must be of type number');
        }

        updateCommands.$inc = updateCommands.$inc || {};
        updateCommands.$inc[key] = value;
    };

    /**
     * Adds the value to an array in the document.
     *
     * @param {String} key The key of the array.
     * @param {*} value The value.
     */
    pub.addToArray = function (key, value) {
        if (!key) {
            return;
        }

        if (typeof key !== 'string') {
            throw new Error('value must be of type string');
        }

        updateCommands.$push = updateCommands.$push || {};
        updateCommands.$push[key] = value;
    };

    /**
     * Deletes the value from an array in the document.
     *
     * @param {String} key The key of the array.
     * @param {*} value The value.
     */
    pub.deleteFromArray = function (key, value) {
        if (!key) {
            return;
        }

        if (typeof key !== 'string') {
            throw new Error('value must be of type string');
        }

        updateCommands.$pull = updateCommands.$pull || {};
        updateCommands.$pull[key] = value;
    };

    return pub;
};