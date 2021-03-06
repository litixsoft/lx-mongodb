/*global describe, it, expect, beforeEach */
'use strict';

var ObjectID = require('mongodb').ObjectID;
var sut = require('../lib/lx-mongodb.js');
var connectionString = 'localhost/blog?w=1&journal=True&fsync=True';
var user = {};
var userRepo = require('./fixtures/usersRepository').UserRepository(sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments', 'documents.files'], ['documents']).users);
var lxHelpers = require('lx-helpers');
var pipeline = [
    {
        $project: {
            age: 1
        }
    },
    {
        $group: {
            _id: {age: '$age'},
            count: { $sum: 1}
        }
    },
    {
        $project: {
            _id: '$_id',
            age: '$age',
            count: '$count'
        }
    }
];

beforeEach(function (done) {
    // clear db
    var db = sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments', 'documents.files'], ['documents']);
    db.users.remove(function () {
        db.documents.files.drop(function () {
            done();
        });
    });

    user = {
        firstName: 'Chuck',
        lastName: 'Norris',
        userName: 'chuck',
        email: 'chuck@norris.com',
        birthdate: new Date(2000, 10, 10),
        age: 20
    };
});

describe('lx-mongodb', function () {
    describe('has a function GetDb() which', function () {
        it('should throw an exception if the arguments are missing or of wrong type', function () {
            expect(function () { return sut.GetDb(null); }).toThrow();
            expect(function () { return sut.GetDb(undefined); }).toThrow();
            expect(function () { return sut.GetDb(1); }).toThrow();
            expect(function () { return sut.GetDb({}); }).toThrow();
            expect(function () { return sut.GetDb([]); }).toThrow();
            expect(function () { return sut.GetDb(true); }).toThrow();
            expect(function () { return sut.GetDb(function () {}); }).toThrow();
            expect(function () { return sut.GetDb(connectionString, ''); }).toThrow();
            expect(function () { return sut.GetDb(connectionString, '', ''); }).toThrow();
        });

        it('should return the db with the given collections', function () {
            var db = sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments', 'documents.files'], ['documents']);

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');
            expect(db.users).toBeDefined();
            expect(typeof db.users).toBe('object');
            expect(db.posts).toBeDefined();
            expect(typeof db.posts).toBe('object');
            expect(db.tags).toBeDefined();
            expect(typeof db.tags).toBe('object');
            expect(db.categories).toBeDefined();
            expect(typeof db.categories).toBe('object');
            expect(db.comments).toBeDefined();
            expect(typeof db.comments).toBe('object');
        });

        it('should return the db from cache and add the collection if it is not already there', function () {
            var db = sut.GetDb(connectionString, ['demo', 'a.b.c']);

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');
            expect(db.users).toBeDefined();
            expect(typeof db.users).toBe('object');
            expect(db.posts).toBeDefined();
            expect(typeof db.posts).toBe('object');
            expect(db.tags).toBeDefined();
            expect(typeof db.tags).toBe('object');
            expect(db.categories).toBeDefined();
            expect(typeof db.categories).toBe('object');
            expect(db.comments).toBeDefined();
            expect(typeof db.comments).toBe('object');
            expect(db.demo).toBeDefined();
            expect(typeof db.demo).toBe('object');
            expect(db.a.b.c).toBeDefined();
            expect(typeof db.a.b.c).toBe('object');
            expect(db.b).toBeUndefined();
        });

        it('should return the db', function () {
            var db = sut.GetDb(connectionString);

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');
        });

        it('should return the db from cache if the connection string is the same', function () {
            var db = sut.GetDb(connectionString);

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');

            var db2 = sut.GetDb(connectionString);

            expect(db2).toBeDefined();
            expect(typeof db2).toBe('object');
            expect(db).toEqual(db);
        });

        it('should return a new db if the connection string is not the same', function () {
            var db = sut.GetDb(connectionString);

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');

            var connectionString2 = connectionString.replace('w=1', 'w=0');
            var db2 = sut.GetDb(connectionString2);

            expect(db2).toBeDefined();
            expect(typeof db2).toBe('object');
            expect(db2).not.toEqual(db);
        });

        it('should return the db with the given gridFs collections', function () {
            var db = sut.GetDb(connectionString);
            var documents = db.documents;

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');

            expect(documents).toBeDefined();
            expect(typeof documents).toBe('object');
        });
    });
});

describe('BaseRepo', function () {
    it('should throw an exception when parameter "collection" is empty', function () {
        var func1 = function () { return sut.BaseRepo(null); };
        var func2 = function () { return sut.BaseRepo(undefined); };
        var func3 = function () { return sut.BaseRepo(false); };
        var func4 = function () { return sut.BaseRepo(); };

        expect(func1).toThrow();
        expect(func2).toThrow();
        expect(func3).toThrow();
        expect(func4).toThrow();
    });

    it('should analyse the schema an set the indexes', function (done) {
        var db = sut.GetDb(connectionString);
        var repo = sut.BaseRepo(db.users);

        // Fetch basic indexInformation for collection
        repo.getCollection().indexInformation({full: true}, function (err, indexInformation) {
            expect(err).toBeNull();
            expect(indexInformation.length).toBe(6);

            var i;
            var length = indexInformation.length;

            for (i = 0; i < length; i++) {
                var idx = indexInformation[i];

                if (idx.name === '_id_') {
                    expect(idx).toEqual({ v: 1, key: { _id: 1 }, ns: 'blog.users', name: '_id_' });
                }

                if (idx.name === 'indexProp_1') {
                    expect(idx).toEqual({ v: 1, key: { indexProp: 1 }, ns: 'blog.users', name: 'indexProp_1' });
                }

                if (idx.name === 'uniqueProp_1') {
                    expect(idx).toEqual({ v: 1, key: { uniqueProp: 1 }, ns: 'blog.users', name: 'uniqueProp_1', unique: true });
                }

                if (idx.name === 'a.aa.name_1') {
                    expect(idx).toEqual({ v: 1, key: { 'a.aa.name': 1 }, ns: 'blog.users', name: 'a.aa.name_1', unique: true });
                }

                if (idx.name === 'a.aa.aaa.aaaa.name_1') {
                    expect(idx).toEqual({ v: 1, key: { 'a.aa.aaa.aaaa.name': 1 }, ns: 'blog.users', name: 'a.aa.aaa.aaaa.name_1' });
                }

                if (idx.name === 'i.ii.iii.iiii.name_1') {
                    expect(idx).toEqual({ v: 1, key: { 'i.ii.iii.iiii.name': 1 }, ns: 'blog.users', name: 'i.ii.iii.iiii.name_1' });
                }
            }

            // drop collection to remove indexes
            db.users.drop(function () {
                done();
            });
        });
    });

    it('has a function getCollection() which should return the collection', function () {
        var db = sut.GetDb(connectionString);
        var repo = sut.BaseRepo(db.users);
        var repo2 = sut.BaseRepo(db.categories);

        expect(typeof repo.getCollection()).toBe('object');
        expect(typeof repo2.getCollection()).toBe('object');
    });

    it('has a function createNewId() which should return a new mongo ObjectID', function () {
        var db = sut.GetDb(connectionString);
        var repo = sut.BaseRepo(db.users);

        expect(typeof repo.createNewId()).toBe('object');
        expect(repo.createNewId() instanceof ObjectID).toBeTruthy();
    });

    it('has a function convertId() which should convert a mongo ObjectID to a string and vice versa', function () {
        var db = sut.GetDb(connectionString);
        var repo = sut.BaseRepo(db.users);
        var id = '5108e9333cb086801f000035';
        var _id = new ObjectID(id);

        expect(typeof repo.convertId(id)).toBe('object');
        expect(repo.convertId(id) instanceof ObjectID).toBeTruthy();

        expect(typeof repo.convertId(_id)).toBe('string');
        expect(repo.convertId(_id)).toBe(id);
    });

    it('has a function getSchema() which should return the schema', function () {
        var db = sut.GetDb(connectionString);
        var repo = sut.BaseRepo(db.users);
        var schema = repo.getSchema();
        var userSchema = userRepo.getSchema();

        expect(typeof schema).toBe('object');
        expect(typeof userSchema).toBe('object');

        userSchema.properties.userName.required = false;

        var userSchema2 = userRepo.getSchema();

        expect(typeof userSchema2).toBe('object');
        expect(userSchema2.properties.userName.required).toBeTruthy();
    });

    it('has a function getValidationOptions() which should return the options for validating', function () {
        var res = userRepo.getValidationOptions();

        expect(res.deleteUnknownProperties).toBeTruthy();
        expect(res.trim).toBeTruthy();
        expect(res.strictRequired).toBeTruthy();
        expect(typeof res.convert).toBe('function');
    });

    it('has a function convert() which should convert values', function () {
        var convert = userRepo.getValidationOptions().convert,
            res = convert('mongo-id', '507f191e810c19729de860ea'),
            res2 = convert('date-time', '1973-06-01T15:49:00.000Z'),
            res3 = convert('date', '1973-06-01'),
            res4 = convert(null, '132'),
            res5 = convert(null, 111);

        expect(lxHelpers.isObject(res)).toBeTruthy();
        expect(res.toHexString()).toBe('507f191e810c19729de860ea');
        expect(lxHelpers.isDate(res2)).toBeTruthy();
        expect(res2).toEqual(new Date('1973-06-01T15:49:00.000Z'));
        expect(lxHelpers.isDate(res3)).toBeTruthy();
        expect(res3).toEqual(new Date('1973-06-01'));
        expect(res4).toBe('132');
        expect(res5).toBe(111);
    });

    describe('has a function createNewId() which', function () {
        it('should return a new mongo ObjectID', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            expect(typeof repo.createNewId()).toBe('object');
            expect(repo.createNewId() instanceof ObjectID).toBeTruthy();
        });
    });

    describe('has a function count() which', function () {
        it('should throw an exception if the params are wrong', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            expect(function () { return repo.count(null); }).toThrow();
            expect(function () { return repo.count({}, {}, null); }).toThrow();
            expect(function () { return repo.count({}, null); }).toThrow();
        });

        it('should return the number of documents of the collection in the BaseRepo', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.count(function (error, result) {
                expect(result).toBe(0);

                repo.insert(user, function () {
                    repo.insert({userName: 'wayne'}, function () {
                        repo.count(function (error, result) {
                            expect(result).toBe(2);

                            repo.count({userName: 'wayne'}, function (error, result) {
                                expect(result).toBe(1);

                                repo.count({limit: 1}, function (error, result) {
                                    expect(result).toBe(1);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it('should return an error callback when the param "query" is not of type object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.count(123, function (error, result) {
                expect(result).toBe(null);
                expect(error).toBeDefined();
                expect(error instanceof TypeError).toBeTruthy();
                expect(error.message).toBe('Param "query" is of type number! Type object expected');

                done();
            });
        });
    });

    describe('has a function insert() which', function () {
        it('should insert a new document in the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function (error, result) {
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBeTruthy();
                expect(result[0].firstName).toBe('Chuck');
                expect(result[0].lastName).toBe('Norris');
                expect(result[0].userName).toBe('chuck');
                expect(result[0].email).toBe('chuck@norris.com');
                expect(result[0].birthdate instanceof Date).toBeTruthy();
                done();
            });
        });

        it('should insert a new document in the collection without callback', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user);

            setTimeout(function () {
                repo.find({userName: 'chuck'}, function (err, result) {
                    expect(result).toBeDefined();
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result[0].firstName).toBe('Chuck');
                    expect(result[0].lastName).toBe('Norris');
                    expect(result[0].userName).toBe('chuck');
                    expect(result[0].email).toBe('chuck@norris.com');
                    expect(result[0].birthdate instanceof Date).toBeTruthy();
                    done();
                });
            }, 100);
        });

        it('should insert a new document in the collection with options and without callback', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, {w: 0});

            setTimeout(function () {
                repo.find({userName: 'chuck'}, function (err, result) {
                    expect(result).toBeDefined();
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result[0].firstName).toBe('Chuck');
                    expect(result[0].lastName).toBe('Norris');
                    expect(result[0].userName).toBe('chuck');
                    expect(result[0].email).toBe('chuck@norris.com');
                    expect(result[0].birthdate instanceof Date).toBeTruthy();
                    done();
                });
            }, 100);
        });

        it('should insert an array with new documents in the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var doc = [user, {userName: 'test'}, {lastName: 'wayne'}];

            repo.insert(doc, function (error, result) {
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBeTruthy();
                expect(result.length).toBe(3);
                expect(result[0].firstName).toBe('Chuck');
                expect(result[0].lastName).toBe('Norris');
                expect(result[0].userName).toBe('chuck');
                expect(result[0].email).toBe('chuck@norris.com');
                expect(result[0].birthdate instanceof Date).toBeTruthy();

                done();
            });
        });

        it('should return an error callback when the param "doc" is not of type object or array', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(123, function (error, result) {
                expect(result).toBeNull();
                expect(error).toBeDefined();
                expect(error instanceof TypeError).toBeTruthy();
                expect(error.message).toBe('Param "doc" is of type number! Type object or array expected');

                done();
            });
        });

        it('should throw an exception if the params are wrong', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            expect(function () { return repo.insert(null); }).toThrow();
            expect(function () { return repo.insert({}, {}, 2); }).toThrow();
            expect(function () { return repo.insert({}, 1); }).toThrow();
        });
    });

    describe('has a function find() which', function () {
        it('should throw an exception if the params are of wrong type', function () {
            expect(function () { return userRepo.find(); }).toThrow();
            expect(function () { return userRepo.find(1, 2); }).toThrow();
            expect(function () { return userRepo.find(1, 2, 3); }).toThrow();
        });

        it('should get all documents of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find(function (err, res) {
                        expect(err).toBeNull();
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);
                        expect(res[0].userName).toBe('chuck');
                        expect(res[1].userName).toBe('wayne');

                        done();
                    });
                });
            });
        });

        it('should callback with an error if the param "query" is not an object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find(123, function (err, res) {
                        expect(err).toBeDefined();
                        expect(err instanceof TypeError).toBeTruthy();
                        expect(res).toBeNull();

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection and check the query', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({limit: 1}, function (err, res) {
                        expect(err).toBeNull();
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(1);

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection and convert $in in query with ids', function (done) {
            var ids = [];

            userRepo.insert(user, function (err, res) {
                ids.push(res[0]._id.toString());
                userRepo.insert({userName: 'wayne'}, function (err, res) {
                    ids.push(res[0]._id.toString());
                    userRepo.insert({userName: 'who'}, function () {
                        userRepo.find({_id: {$in: ids}}, function (err, res) {
                            expect(err).toBeNull();
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(2);
                            expect(res[0].userName).toBe('chuck');
                            expect(res[1].userName).toBe('wayne');

                            done();
                        });
                    });
                });
            });
        });

        it('should get all documents of the collection and not convert $in in query with ids when ids are already mongo-ids', function (done) {
            var ids = [];

            userRepo.insert(user, function (err, res) {
                ids.push(res[0]._id);
                userRepo.insert({userName: 'wayne'}, function (err, res) {
                    ids.push(res[0]._id);
                    userRepo.insert({userName: 'who'}, function () {
                        userRepo.find({_id: {$in: ids}}, function (err, res) {
                            expect(err).toBeNull();
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(2);
                            expect(res[0].userName).toBe('chuck');
                            expect(res[1].userName).toBe('wayne');

                            done();
                        });
                    });
                });
            });
        });

        it('should get all documents of the collection with filter', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({userName: 'wayne'}, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(1);

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with limit', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, {limit: 1}, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(1);

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with skip', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, {skip: 1}, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(1);
                        expect(res[0].userName).toBe('wayne');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with the specified fields Array', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                fields: ['userName', 'lastName']
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, options, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('chuck');
                        expect(res[0].lastName).toBe('Norris');
                        expect(res[0]._id).toBeDefined();
                        expect(res[0].email).toBeUndefined();
                        expect(res[0].birthdate).toBeUndefined();
                        expect(Object.keys(res[0]).length).toBe(3);

                        expect(res[1].userName).toBe('wayne');
                        expect(res[1].lastName).toBeUndefined();
                        expect(res[1].lastName).toBeUndefined();
                        expect(Object.keys(res[1]).length).toBe(2);

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with the specified fields Object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                fields: {
                    'userName': 1,
                    'lastName': 1
                }
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, options, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('chuck');
                        expect(res[0].lastName).toBe('Norris');
                        expect(res[0]._id).toBeDefined();
                        expect(res[0].email).toBeUndefined();
                        expect(res[0].birthdate).toBeUndefined();
                        expect(Object.keys(res[0]).length).toBe(3);

                        expect(res[1].userName).toBe('wayne');
                        expect(res[1].lastName).toBeUndefined();
                        expect(res[1].lastName).toBeUndefined();
                        expect(Object.keys(res[1]).length).toBe(2);

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with the specified sorting ascending', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                sort: {'userName': 1}
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, options, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('chuck');
                        expect(res[1].userName).toBe('wayne');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with the specified sorting descending', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                sort: {
                    userName: -1
                }
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, options, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('wayne');
                        expect(res[1].userName).toBe('chuck');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection and sort by string', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                sort: 'userName'
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.find({}, options, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('chuck');
                        expect(res[1].userName).toBe('wayne');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection and sort by array of strings', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                sort: ['userName', 'age']
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne', age: 15}, function () {
                    repo.insert({userName: 'wayne', age: 10}, function () {
                        repo.find({}, options, function (err, res) {
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(3);

                            expect(res[0].userName).toBe('chuck');
                            expect(res[1].userName).toBe('wayne');
                            expect(res[1].age).toBe(10);
                            expect(res[2].userName).toBe('wayne');
                            expect(res[2].age).toBe(15);

                            done();
                        });
                    });
                });
            });
        });

        it('should get all documents of the collection and sort by array', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                sort: [
                    ['userName', 1],
                    ['age' , -1]
                ]
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne', age: 10}, function () {
                    repo.insert({userName: 'wayne', age: 15}, function () {
                        repo.find({}, options, function (err, res) {
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(3);

                            expect(res[0].userName).toBe('chuck');
                            expect(res[1].userName).toBe('wayne');
                            expect(res[1].age).toBe(15);
                            expect(res[2].userName).toBe('wayne');
                            expect(res[2].age).toBe(10);

                            done();
                        });
                    });
                });
            });
        });

        it('should get all documents of the collection and sort by object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            var options = {
                sort: {
                    userName: 1,
                    age: -1
                }
            };

            repo.insert(user, function () {
                repo.insert({userName: 'wayne', age: 10}, function () {
                    repo.insert({userName: 'wayne', age: 15}, function () {
                        repo.find({}, options, function (err, res) {
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(3);

                            expect(res[0].userName).toBe('chuck');
                            expect(res[1].userName).toBe('wayne');
                            expect(res[1].age).toBe(15);
                            expect(res[2].userName).toBe('wayne');
                            expect(res[2].age).toBe(10);

                            done();
                        });
                    });
                });
            });
        });

        it('should get all documents of the collection with the default sorting', function (done) {
            userRepo.insert(user, function () {
                userRepo.insert({userName: 'aaa'}, function () {
                    userRepo.find(function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('aaa');
                        expect(res[1].userName).toBe('chuck');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with the default sorting when param sort is empty', function (done) {
            userRepo.insert(user, function () {
                userRepo.insert({userName: 'aaa'}, function () {
                    userRepo.find({}, {sort: null}, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('aaa');
                        expect(res[1].userName).toBe('chuck');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection and convert the id in the query to mongo id', function (done) {
            userRepo.insert(user, function (err, res) {
                var id = res[0]._id;

                userRepo.insert({userName: 'aaa', chief_id: id, i: {ii: {manager_id: id}}}, function (err, res) {
                    expect(err).toBeNull();
                    expect(res).toBeDefined();

                    userRepo.find({chief_id: id.toHexString()}, function (err, res1) {
                        expect(Array.isArray(res1)).toBeTruthy();
                        expect(res1.length).toBe(1);
                        expect(res1[0].userName).toBe('aaa');
                        expect(res1[0].chief_id.toHexString()).toBe(id.toHexString());

                        userRepo.find({'i.ii.manager_id': id.toHexString()}, function (err, res1) {
                            expect(Array.isArray(res1)).toBeTruthy();
                            expect(res1.length).toBe(1);
                            expect(res1[0].userName).toBe('aaa');
                            expect(res1[0].i.ii.manager_id.toHexString()).toBe(id.toHexString());

                            done();
                        });
                    });
                });
            });
        });
    });

    describe('has a function findOne() which', function () {
        it('should throw an exception if the params are of wrong type', function () {
            expect(function () { return userRepo.findOne(); }).toThrow();
            expect(function () { return userRepo.findOne({}); }).toThrow();
            expect(function () { return userRepo.findOne(1, 2); }).toThrow();
            expect(function () { return userRepo.findOne(1, 2, 3); }).toThrow();
        });

        it('should return one document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.findOne({userName: 'chuck'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res.userName).toBe('chuck');
                        expect(res.lastName).toBe('Norris');

                        done();
                    });
                });
            });
        });

        it('should callback with an error if the param "query" is not an object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.findOne(123, function (err, res) {
                        expect(err).toBeDefined();
                        expect(err instanceof TypeError).toBeTruthy();
                        expect(res).toBeNull();

                        done();
                    });
                });
            });
        });

        it('should return one document of the collection and check the query', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.findOne({fields: ['_id']}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res._id).toBeDefined();

                        done();
                    });
                });
            });
        });

        it('should return no document when the collection is empty', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.findOne({}, function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBeNull();

                done();
            });
        });

        it('should return no document when the query not matches any document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.findOne({userName: 'who?'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBeNull();

                        done();
                    });
                });
            });
        });
    });

    describe('has a function findOneById() which', function () {
        it('should return one document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.findOne({userName: 'chuck'}, function (err, res) {
                        expect(res).toBeDefined();

                        repo.findOneById(res._id, function (err, res1) {
                            expect(res1).toBeDefined();
                            expect(res1._id.toString()).toBe(res._id.toString());
                            expect(res1.userName).toBe('chuck');
                            done();
                        });
                    });
                });
            });
        });

        it('should return one document of the collection and convert the id to a mongo id', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.findOne({userName: 'chuck'}, function (err, res) {
                        expect(res).toBeDefined();

                        repo.findOneById(res._id.toHexString(), function (err, res1) {
                            expect(err).toBeNull();
                            expect(res1).not.toBeNull();
                            expect(res1._id.toString()).toBe(res._id.toString());
                            expect(res1.userName).toBe('chuck');
                            done();
                        });
                    });
                });
            });
        });

        it('should return no document when the collection is empty', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.findOneById('5108e9333cb086801f000035', function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBeNull();

                done();
            });
        });

        it('should return no document when the id not matches any document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.findOneById('5108e9333cb086801f000035', function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBe(null);

                done();
            });
        });

        it('should return no document when the id is of wrong type', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.findOneById(123, function (err, res) {
                expect(err).toBeDefined();
                expect(err instanceof TypeError).toBeTruthy();
                expect(err.message).toBe('Param "id" is of type number! Type object or string expected');
                expect(res).toBeDefined();
                expect(res).toBeNull();

                done();
            });
        });

        it('should return no document when the id undefined or null', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.findOneById(null, function (err, res) {
                expect(err).toBeDefined();
                expect(err instanceof TypeError).toBeTruthy();
                expect(err.message).toBe('Param "id" is of type null! Type object or string expected');
                expect(res).toBeDefined();
                expect(res).toBe(null);

                repo.findOneById(undefined, function (err, res) {
                    expect(err).toBeDefined();
                    expect(err instanceof TypeError).toBeTruthy();
                    expect(err.message).toBe('Param "id" is of type undefined! Type object or string expected');
                    expect(res).toBeDefined();
                    expect(res).toBe(null);

                    done();
                });
            });
        });

        it('should throw an exception when the params are of wrong type', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            expect(function () { return repo.findOneById(1, 2, 3); }).toThrow();
            expect(function () { return repo.findOneById(null, undefined, 'test'); }).toThrow();
            expect(function () { return repo.findOneById(); }).toThrow();
        });
    });

    describe('has a function update() which', function () {
        it('should update the document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.update({userName: 'chuck'}, {'$set': {userName: 'bob'}}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBe(1);

                        repo.findOne({userName: 'bob'}, function (err, res1) {
                            expect(res1).toBeDefined();
                            expect(res1.userName).toBe('bob');
                            expect(res1.lastName).toBe('Norris');
                            expect(res1.email).toBe('chuck@norris.com');

                            done();
                        });
                    });
                });
            });
        });

        it('should update no document when the query matches no document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.update({userName: 'chuck1'}, {userName: 'bob'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBe(0);

                        done();
                    });
                });
            });
        });

        it('should throw an exception when the number of params is less than 3', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.update(1, 2); };
            var func2 = function () { return repo.update(1); };
            var func3 = function () { return repo.update(); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
        });

        it('should update the document of the collection', function (done) {
            var user = {
                firstName: 'Chuck',
                lastName: 'Norris',
                userName: 'chuck',
                email: 'chuck@norris.com',
                birthdate: '1973-06-01T15:49:00.000Z',
                age: 44
            };

            userRepo.insert(user, function () {
                userRepo.update({userName: 'chuck'}, {'$set': {userName: 'bob'}}, function (err, res) {
                    expect(res).toBeDefined();
                    expect(res).toBe(1);

                    userRepo.findOne({userName: 'bob'}, function (err, res1) {
                        expect(res1).toBeDefined();
                        expect(res1.userName).toBe('bob');
                        expect(res1.lastName).toBe('Norris');
                        expect(res1.email).toBe('chuck@norris.com');

                        done();
                    });
                });

            });
        });

        it('should update the document of the collection and has no options as parameter', function (done) {
            var user = {
                firstName: 'Chuck',
                lastName: 'Norris',
                userName: 'chuck',
                email: 'chuck@norris.com',
                birthdate: '1973-06-01T15:49:00.000Z',
                age: 44
            };

            userRepo.insert(user, function () {
                userRepo.update({userName: 'chuck'}, {'$set': {userName: 'bob'}}, null, function (err, res) {
                    expect(res).toBeDefined();
                    expect(res).toBe(1);

                    userRepo.findOne({userName: 'bob'}, function (err, res1) {
                        expect(res1).toBeDefined();
                        expect(res1.userName).toBe('bob');
                        expect(res1.lastName).toBe('Norris');
                        expect(res1.email).toBe('chuck@norris.com');

                        done();
                    });
                });

            });
        });

        it('should update all documents of the collection', function (done) {
            var user1 = {
                firstName: 'Chuck',
                lastName: 'Norris',
                userName: 'chuck'
            };

            var user2 = {
                firstName: 'Chuck',
                lastName: 'Norris',
                userName: 'chuck'
            };

            userRepo.insert(user1, function () {
                userRepo.insert(user2, function () {
                    userRepo.count({userName: 'chuck'}, function (err, res) {
                        expect(res).toBe(2);

                        userRepo.update({userName: 'chuck'}, {'$set': {userName: 'bob'}}, {multi: true}, function (err, res) {
                            expect(res).toBeDefined();
                            expect(res).toBe(2);

                            userRepo.count({userName: 'chuck'}, function (err, res) {
                                expect(res).toBe(0);
                                userRepo.count({userName: 'bob'}, function (err, res) {
                                    expect(res).toBe(2);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it('should delete the key of the document on update', function (done) {
            var user = {
                firstName: 'Chuck',
                lastName: 'Norris',
                userName: 'chuck',
                email: 'chuck@norris.com',
                birthdate: '1973-06-01T15:49:00.000Z',
                age: 44
            };

            userRepo.insert(user, function (err, res) {
                res[0].userName = 'bob';

                userRepo.update({userName: 'chuck'}, {'$set': res[0]}, function (err, res) {
                    expect(res).toBeDefined();
                    expect(res).toBe(1);

                    userRepo.findOne({userName: 'bob'}, function (err, res1) {
                        expect(res1).toBeDefined();
                        expect(res1.userName).toBe('bob');
                        expect(res1.lastName).toBe('Norris');
                        expect(res1.email).toBe('chuck@norris.com');

                        res1.lastName = 'Wayne';

                        userRepo.update({userName: 'bob'}, res1, function (err, res2) {
                            expect(res2).toBeDefined();
                            expect(res2).toBe(1);

                            userRepo.findOne({lastName: 'Wayne'}, function (err, res3) {
                                expect(res3).toBeDefined();
                                expect(res3.userName).toBe('bob');
                                expect(res3.lastName).toBe('Wayne');
                                expect(res3.email).toBe('chuck@norris.com');

                                done();
                            });
                        });
                    });
                });

            });
        });
    });

    describe('has a function remove() which', function () {
        it('should remove the document of the collection with a query', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.insert({userName: 'troll'}, function () {
                        repo.remove({userName: 'chuck'}, function (err, res) {
                            expect(err).toBeNull();
                            expect(res).toBe(1);

                            repo.count(function (err, res1) {
                                expect(res1).toBe(2);

                                repo.remove({userName: 'wayne'}, {w: 1}, function (err, res2) {
                                    expect(res2).toBeDefined();
                                    expect(res2).toBe(1);

                                    repo.count(function (err, res3) {
                                        expect(res3).toBe(1);

                                        repo.remove({userName: 'troll'});

                                        setTimeout(function () {
                                            repo.count(function (err, res) {
                                                expect(res).toBe(0);

                                                done();
                                            });
                                        }, 100);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it('should remove all documents of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.remove();

                    setTimeout(function () {
                        repo.count(function (err, res) {
                            expect(res).toBe(0);

                            done();
                        });
                    }, 100);
                });
            });
        });

        it('should remove all documents of the collection with options', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.remove({w: 1});

                    setTimeout(function () {
                        repo.count(function (err, res) {
                            expect(res).toBe(0);

                            done();
                        });
                    }, 100);
                });
            });
        });

        it('should remove all documents of the collection with callback', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.remove(function () {
                        repo.count(function (err, res) {
                            expect(res).toBe(0);

                            done();
                        });
                    });
                });
            });
        });

        it('should remove all documents of the collection with callback', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.remove({w: 1}, function () {
                        repo.count(function (err, res) {
                            expect(res).toBe(0);

                            done();
                        });
                    });
                });
            });
        });

        it('should return an error callback when the param "query" is not of type object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.remove(null, function (err, res) {
                        expect(err).toBeDefined();
                        expect(err instanceof TypeError).toBeTruthy();
                        expect(err.message).toBe('Param "query" is of type null! Type object expected');
                        expect(res).toBeNull();

                        done();
                    });
                });
            });
        });

        it('should return an error callback when the param "options" is not of type object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne'}, function () {
                    repo.remove({}, 33, function (err, res) {
                        expect(err).toBeDefined();
                        expect(err instanceof TypeError).toBeTruthy();
                        expect(err.message).toBe('Param "options" is of type number! Type object expected');
                        expect(res).toBeNull();

                        done();
                    });
                });
            });
        });

        it('should throw an exception when params are of wrong type', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            expect(function () { return repo.remove(1, 2); }).toThrow();
            expect(function () { return repo.remove(1, 2, 3); }).toThrow();
            expect(function () { return repo.remove({}, 1); }).toThrow();
            expect(function () { return repo.remove({}, 1, 2); }).toThrow();
            expect(function () { return repo.remove({}, {}, 2); }).toThrow();
        });
    });

    describe('has a function aggregate() which', function () {
        it('should return an error callback when the param "pipeline" is not of type array', function (done) {
            userRepo.aggregate('', {}, function (err, res) {
                expect(err).toBeDefined();
                expect(err instanceof TypeError).toBeTruthy();
                expect(err.message).toBe('Param "pipeline" is of type string! Type array expected');
                expect(res).toBeNull();

                done();
            });
        });

        it('should throw an exception when the number of params is less than 2', function () {
            var func1 = function () { return userRepo.aggregate(1); };

            expect(func1).toThrow();
        });

        it('should execute the aggregation pipeline', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne', age: 20}, function () {
                    repo.insert({userName: 'hans', age: 30}, function () {
                        repo.aggregate(pipeline, {}, function (err, res) {
                            expect(err).toBeNull();
                            expect(res).toBeDefined();
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(2);
                            expect(res).toEqual([
                                { _id: { age: 30 }, count: 1 },
                                { _id: { age: 20 }, count: 2 }
                            ]);

                            done();
                        });
                    });
                });
            });
        });

        it('should execute the aggregation pipeline and set options to empty object when number of params is 2', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne', age: 20}, function () {
                    repo.insert({userName: 'hans', age: 30}, function () {
                        repo.aggregate(pipeline, function (err, res) {
                            expect(err).toBeNull();
                            expect(res).toBeDefined();
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(2);
                            expect(res).toEqual([
                                { _id: { age: 30 }, count: 1 },
                                { _id: { age: 20 }, count: 2 }
                            ]);

                            done();
                        });
                    });
                });
            });
        });

        it('should execute the aggregation pipeline and set options to empty object when options are empty', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.insert(user, function () {
                repo.insert({userName: 'wayne', age: 20}, function () {
                    repo.insert({userName: 'hans', age: 30}, function () {
                        repo.aggregate(pipeline, null, function (err, res) {
                            expect(err).toBeNull();
                            expect(res).toBeDefined();
                            expect(Array.isArray(res)).toBeTruthy();
                            expect(res.length).toBe(2);
                            expect(res).toEqual([
                                { _id: { age: 30 }, count: 1 },
                                { _id: { age: 20 }, count: 2 }
                            ]);

                            done();
                        });
                    });
                });
            });
        });
    });
});

describe('GridFsBaseRepo', function () {
    it('should throw an exception when parameter "collection" is empty', function () {
        var func1 = function () { return sut.GridFsBaseRepo(null); };
        var func2 = function () { return sut.GridFsBaseRepo(undefined); };
        var func3 = function () { return sut.GridFsBaseRepo(false); };
        var func4 = function () { return sut.GridFsBaseRepo(); };

        expect(func1).toThrow();
        expect(func2).toThrow();
        expect(func3).toThrow();
        expect(func4).toThrow();
    });

    it('has a function getCollection() which should return the collection', function () {
        var db = sut.GetDb(connectionString);
        var repo = sut.GridFsBaseRepo(db.documents);

        expect(typeof repo.getCollection()).toBe('object');
    });

    describe('has functions put(), get() and delete() which', function () {
        it('should store a buffer, finding it and deleting it', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.GridFsBaseRepo(db.documents);
            var repoFiles = sut.BaseRepo(db.documents.files);
            var buffer = 'Hello wörld^1';
            var id;

            expect(repoFiles).toBeDefined();

            // save
            repo.put(new Buffer(buffer), {metadata: {'type': 'customer'}}, function (error, result) {
                expect(error).toBe(null);
                expect(result).toBeDefined();
                expect(result._id).toBeDefined();
                expect(result._id instanceof ObjectID).toBeTruthy();
                id = result._id;

                // get
                repo.get(id, function (error, data) {
                    expect(error).toBe(null);
                    expect(data).toBeDefined();

                    // use count in documents repo
                    repoFiles.count({'metadata.type': 'customer'}, function (error, result) {
                        expect(error).toBe(null);
                        expect(result).toBe(1);

                        // delete
                        repo.delete(id, function (error, result2) {
                            expect(error).toBe(null);
                            expect(result2).toBeTruthy();

                            // Fetch the content, showing that the file is gone
                            repo.get(id, function (error, data2) {
                                expect(error).toBeDefined();
                                expect(data2).toBe(null);

                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});