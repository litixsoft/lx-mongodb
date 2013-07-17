'use strict';

var lxDb = require('../../lib/lx-mongodb');

exports.UserRepository = function (collection) {
    var schema = function () {
        return {
            'properties': {
                '_id': {
                    'type': 'string',
                    'required': false,
                    'format': 'mongo-id',
                    'key': true
                }
            }
        };
    };
    var gridFsBaseRepo = lxDb.GridFsBaseRepo(collection, schema);

    return gridFsBaseRepo;
};