exports.TagRepository = function (baseRepo) {
    'use strict';

    var collection = baseRepo.getCollection(),
        val = require('bbvalid'),
        schema = {
            'properties': {
                '_id': {
                    'type': 'string',
                    'required': false
                },
                'tagName': {
                    'type': 'string',
                    'required': true
                }
            }
        };

    collection.ensureIndex({'tagName': 1}, {unique: true}, function (error) {
        if (error) {
            console.error(error);
        }
    });

    baseRepo.setDefaultSortField('tagName');

    // validators
    baseRepo.checkTagName = function (tagName, cb) {
        collection.findOne({tagName: tagName}, function (err, res) {

            if (err) {
                cb(err);
            } else if (res) {
                cb(null, {valid: false, errors: [
                    {attribute: 'checkTagName',
                        property: 'tagName', expected: false, actual: true,
                        message: 'tagName already exists'}
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

    baseRepo.validate = function (doc, isUpdate, schema, cb) {

        var tagNameCheck = true;

        // check is update
        if (isUpdate) {

            for (var schemaProp in schema.properties) {
                if (schema.properties.hasOwnProperty(schemaProp)) {
                    if (!doc.hasOwnProperty(schemaProp)) {
                        schema.properties[schemaProp].required = false;
                    }
                }
            }

            if (!doc.hasOwnProperty('tagName')) {
                tagNameCheck = false;
            }
        }

        // json schema validate
        var valResult = val.validate(doc, schema);

        // register async validator
        if (tagNameCheck) {
            val.asyncValidate.register(baseRepo.checkTagName, doc.tagName);
        }

        // async validate
        val.asyncValidate.exec(valResult, cb);
    };

    return baseRepo;
};
