exports.CommentRepository = function (baseRepo) {
    'use strict';

    var collection = baseRepo.getCollection(),
        schema = {
            'properties': {
                '_id': {
                    'type': 'string',
                    'id': '_id',
                    'required': false
                },
                'author': {
                    'type': 'string',
                    'id': 'author',
                    'required': true,
                    'format': 'mongo-id'
                },
                'body': {
                    'type': 'string',
                    'id': 'body',
                    'required': true
                },
                'created': {
                    'type': 'string',
                    'id': 'created',
                    'required': true,
                    'format': 'dateTime'
                },
                'subject': {
                    'type': 'string',
                    'id': 'subject',
                    'required': true
                }
            }
        };

    collection.ensureIndex({'created': 1}, null, function (error) {
        if (error) {
            console.error(error);
        }
    });

    baseRepo.setDefaultSortField('created');

    baseRepo.getSchema = function () {
        return schema;
    };

    return baseRepo;
};

