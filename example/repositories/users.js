exports.UserRepository = function (baseRepo) {
    'use strict';

    var collection = baseRepo.getCollection(),
        val = require('lx-valid'),
        schema = {
            'properties': {
                '_id': {
                    'type': 'string',
                    'required': false
                },
                'birthdate': {
                    'type': 'string',
                    'required': true,
                    'format': 'dateTime'
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
                    'required': true
                }
            }
        };

    collection.ensureIndex({'userName': 1}, {unique: true}, function (error) {
        if (error) {
            console.error(error);
        }
    });

    collection.ensureIndex({'email': 1}, {unique: true}, function (error) {
        if (error) {
            console.error(error);
        }
    });

    baseRepo.setDefaultSortField('userName');

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

    baseRepo.getSchema = function () {
        return schema;
    };

    // Todo options: {dataset, schema || schema, isUpdate}

    baseRepo.validate = function (doc, isUpdate, schema, cb) {

        var emailCheck = true;
        var userNameCheck = true;

        // check is update
        if (isUpdate) {
            // Todo Prüfung auf required fields
            for (var schemaProp in schema.properties) {
                if (schema.properties.hasOwnProperty(schemaProp)) {
                    if (!doc.hasOwnProperty(schemaProp)) {
                        schema.properties[schemaProp].required = false;
                    }
                }
            }

            if (!doc.hasOwnProperty('userName')) {
                userNameCheck = false;
            }

            if (!doc.hasOwnProperty('email')) {
                emailCheck = false;
            }
        }

        // json schema validate
        var valResult = val.validate(doc, schema);

        // register async validator
        if (userNameCheck) {
            //noinspection JSUnresolvedVariable
            val.asyncValidate.register(baseRepo.checkUserName, doc.userName);
        }

        // register async validator
        if (emailCheck) {
            //noinspection JSUnresolvedVariable
            val.asyncValidate.register(baseRepo.checkUserEmail, doc.email);
        }

        // async validate
        //noinspection JSUnresolvedVariable
        val.asyncValidate.exec(valResult, cb);
    };

    baseRepo.convert = function (doc) {
        if (doc.hasOwnProperty('birthdate') && typeof doc.birthdate === 'string') {
            doc.birthdate = new Date(doc.birthdate);
        }

        return doc;
    };

    return baseRepo;
};