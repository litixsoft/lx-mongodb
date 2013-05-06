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
                },
                'chief_id': {
                    'type': 'string',
                    'required': false,
                    'format': 'mongo-id'
                },
                'birthdate': {
                    'type': 'string',
                    'required': true,
                    'format': 'date-time'
                },
                'email': {
                    'type': 'string',
                    'required': true,
                    'format': 'email'
                },
                'firstName': {
                    'type': 'string',
                    'required': true
                },
                'lastName': {
                    'type': 'string',
                    'required': true
                },
                'userName': {
                    'type': 'string',
                    'required': true,
                    'sort': 1
                },
                'age': {
                    'type': 'integer',
                    'required': false
                }
            }
        };
    };
    var baseRepo = lxDb.BaseRepo(collection, schema);

    // validators
    baseRepo.checkUserName = function (userName, cb) {
        collection.findOne({userName: userName}, function (err, res) {

            if (err) {
                cb(err);
            } else if (res) {
                cb(null, {valid: false, errors: [
                    {attribute: 'checkUserName',
                        property: 'userName', expected: false, actual: true,
                        message: 'userName already exists'}
                ]});
            }
            else {
                cb(null, {valid: true});
            }
        });
    };

    baseRepo.checkUserEmail = function (email, cb) {
        collection.findOne({email: email}, function (err, res) {

            if (err) {
                cb(err);
            } else if (res) {
                cb(null, {valid: false, errors: [
                    {attribute: 'checkUserEmail',
                        property: 'email', expected: false, actual: true,
                        message: 'email already exists'}
                ]});
            }
            else {
                cb(null, {valid: true});
            }
        });
    };

    baseRepo.convert = function (doc) {
        if (doc.hasOwnProperty('birthdate') && typeof doc.birthdate === 'string') {
            doc.birthdate = new Date(doc.birthdate);
        }

        return doc;
    };

    return baseRepo;
};