exports.CommentRepository = function (collection, lxDb) {
    'use strict';

    var schema = {
            'properties': {
                '_id': {
                    'type': 'string',
                    'required': false,
                    'format': 'mongo-id',
                    'key': true
                },
                'author': {
                    'type': 'string',
                    'required': true,
                    'format': 'mongo-id'
                },
                'body': {
                    'type': 'string',
                    'required': true
                },
                'created': {
                    'type': 'string',
                    'required': true,
                    'format': 'dateTime',
                    'sort': -1
                },
                'subject': {
                    'type': 'string',
                    'id': 'subject',
                    'required': true
                }
            }
        },
        baseRepo = lxDb.BaseRepo(collection, schema);

    collection.ensureIndex({'created': 1}, null, function (error) {
        if (error) {
            console.error(error);
        }
    });

    baseRepo.getSchema = function () {
        return schema;
    };

    return baseRepo;
};

