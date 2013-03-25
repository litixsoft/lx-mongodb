exports.PostRepository = function (baseRepo) {
    'use strict';

    var collection = baseRepo.getCollection(),
        schema = {
        'properties': {
            '_id': {
                'type': 'string',
                'required': false
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
            'category': {
                'type': 'string',
                'required': true,
                'format': 'mongo-id'
            },
            'comments': {
                'type': 'array',
                'required': false,
                'items':
                {
                    'type': 'object',
                    'required': true,
                    'properties': {
                        '_id': {
                            'type': 'string',
                            'required': true,
                            'format': 'mongo-id'
                        }
                    }
                }
            },
            'created': {
                'type': 'string',
                'required': true,
                'format': 'dateTime'
            },
            'tags': {
                'type': 'array',
                'required': false,
                'items':
                {
                    'type': 'object',
                    'required': true,
                    'properties': {
                        '_id': {
                            'type': 'string',
                            'required': true,
                            'format': 'mongo-id'
                        }
                    }
                }
            },
            'title': {
                'type': 'string',
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

    baseRepo.getTitles = function (options, cb) {

        if (arguments.length === 1) {
            cb = options;
            options = {};
        }

        if (typeof options !== 'object') {
            throw new Error('options must be of function type');
        }

        if (typeof cb !== 'function') {
            throw new Error('callback must be of function type');
        }

        if (!options.hasOwnProperty('sort')) {
            options.sort = -1;
        }

        options.projection = {title: 1};

        baseRepo.getAll(options, cb);
    };

    return baseRepo;
};
