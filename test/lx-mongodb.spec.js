/*global describe, it, expect, beforeEach */
'use strict';

var ObjectID = require('mongodb').ObjectID;
var sut = require('../lib/lx-mongodb.js');
var connectionString = 'localhost/blog?w=1&journal=True&fsync=True';
var user = {};
var userRepo = require('./fixtures/usersRepository').UserRepository(sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments']).users);

beforeEach(function (done) {
    // clear db
    var db = sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments']);
    db.users.drop(function () {done();});

    user = {
        firstName: 'Chuck',
        lastName: 'Norris',
        userName: 'chuck',
        email: 'chuck@norris.com',
        birthdate: new Date(2000, 10, 10)
    };
});

describe('lx-mongodb', function () {
    describe('has a function GetDb() which', function () {
        it('should throw an exception if the arguments are missing or of wrong type', function () {
            var func1 = function () { return sut.GetDb(null); };
            var func2 = function () { return sut.GetDb(undefined); };
            var func3 = function () { return sut.GetDb(1); };
            var func4 = function () { return sut.GetDb({}); };
            var func5 = function () { return sut.GetDb([]); };
            var func6 = function () { return sut.GetDb(true); };
            var func7 = function () { return sut.GetDb(function () {}); };
            var func8 = function () { return sut.GetDb(connectionString, ''); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
            expect(func6).toThrow();
            expect(func7).toThrow();
            expect(func8).toThrow();
        });

        it('should return the db with the given collections', function () {
            var db = sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments']);

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

        it('should return the db', function () {
            var db = sut.GetDb(connectionString);

            expect(db).toBeDefined();
            expect(typeof db).toBe('object');
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

    describe('has a function getCount() which', function () {
        it('should return the number of documents of the collection in the BaseRepo', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getCount(function (error, result) {
                expect(result).toBe(0);

                repo.create(user, function () {
                    repo.create({userName: 'wayne'}, function () {
                        repo.getCount(function (error, result) {
                            expect(result).toBe(2);

                            repo.getCount({userName: 'wayne'}, function (error, result) {
                                expect(result).toBe(1);

                                done();
                            });
                        });
                    });
                });
            });
        });

        it('should return a error callback when the param "query" is not of type object', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getCount(123, function (error, result) {
                expect(result).toBe(null);
                expect(error).toBeDefined();
                expect(error instanceof TypeError).toBeTruthy();
                expect(error.message).toBe('query must be of type object');

                done();
            });
        });
    });

    describe('has a function create() which', function () {
        it('should insert a new document in the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function (error, result) {
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

        it('should throw an exception if the params are wrong', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.create(null); };
            var func2 = function () { return repo.create(null, 1, 2); };
            var func3 = function () { return repo.create(null, null); };
            var func4 = function () { return repo.create({}, null); };
            var func5 = function () { return repo.create(undefined, function () {}); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
        });
    });

    describe('has a function getAll() which', function () {
        it('should get all documents of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll(function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);
                        expect(res[0].userName).toBe('chuck');
                        expect(res[1].userName).toBe('wayne');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with filter', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({userName: 'wayne'}, function (err, res) {
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

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({}, {limit: 1}, function (err, res) {
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

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({}, {skip: 1}, function (err, res) {
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

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({}, options, function (err, res) {
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

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({}, options, function (err, res) {
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
                sortBy: 'userName',
                sort: 1
            };

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({}, options, function (err, res) {
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
                sortBy: 'userName',
                sort: -1
            };

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getAll({}, options, function (err, res) {
                        expect(Array.isArray(res)).toBeTruthy();
                        expect(res.length).toBe(2);

                        expect(res[0].userName).toBe('wayne');
                        expect(res[1].userName).toBe('chuck');

                        done();
                    });
                });
            });
        });

        it('should get all documents of the collection with the default sorting', function (done) {
            userRepo.create(user, function () {
                userRepo.create({userName: 'aaa'}, function () {
                    userRepo.getAll(function (err, res) {
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
            userRepo.create(user, function (err, res) {
                var id = res[0]._id;

                userRepo.create({userName: 'aaa', chief_id: id}, function () {
                    userRepo.getAll({chief_id: id.toHexString()}, function (err, res1) {
                        expect(Array.isArray(res1)).toBeTruthy();
                        expect(res1.length).toBe(1);
                        expect(res1[0].userName).toBe('aaa');
                        expect(res1[0].chief_id.toHexString()).toBe(id.toHexString());

                        done();
                    });
                });
            });
        });
    });

    describe('has a function getOne() which', function () {
        it('should return one document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getOne({userName: 'chuck'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res.userName).toBe('chuck');
                        expect(res.lastName).toBe('Norris');

                        done();
                    });
                });
            });
        });

        it('should return no document when the collection is empty', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getOne({}, function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBeNull();

                done();
            });
        });

        it('should return no document when the query not matches any document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getOne({userName: 'who?'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBeNull();

                        done();
                    });
                });
            });
        });

        it('should throw an exception if number of params less than 2', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.getOne({}); };
            var func2 = function () { return repo.getOne(); };

            expect(func1).toThrow();
            expect(func2).toThrow();
        });
    });

    describe('has a function getOneById() which', function () {
        it('should return one document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.getOne({userName: 'chuck'}, function (err, res) {
                        expect(res).toBeDefined();

                        repo.getOneById(res._id, function (err, res1) {
                            expect(res1).toBeDefined();
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

            repo.getOneById('5108e9333cb086801f000035', function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBeNull();

                done();
            });
        });

        it('should return no document when the id not matches any document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getOneById('5108e9333cb086801f000035', function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBe(null);

                done();
            });
        });

        it('should return no document when the id is of wrong type', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getOneById(123, function (err, res) {
                expect(err).toBeDefined();
                expect(err instanceof TypeError).toBeTruthy();
                expect(err.message).toBe('id must be of type string or object');
                expect(res).toBeDefined();
                expect(res).toBe(null);

                done();
            });
        });

        it('should return no document when the id undefined or null', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getOneById(null, function (err, res) {
                expect(err).toBeDefined();
                expect(err instanceof TypeError).toBeTruthy();
                expect(err.message).toBe('id must be of type string or object');
                expect(res).toBeDefined();
                expect(res).toBe(null);

                repo.getOneById(undefined, function (err, res) {
                    expect(err).toBeDefined();
                    expect(err instanceof TypeError).toBeTruthy();
                    expect(err.message).toBe('id must be of type string or object');
                    expect(res).toBeDefined();
                    expect(res).toBe(null);

                    done();
                });
            });
        });

        it('should throw an exception when the params are of wrong type', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.getOneById(1, 2, 3); };
            var func2 = function () { return repo.getOneById(null, undefined, 'test'); };

            expect(func1).toThrow();
            expect(func2).toThrow();
        });
    });

    describe('has a function update() which', function () {
        it('should update the document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.update({userName: 'chuck'}, {'$set': {userName: 'bob'}}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBe(1);

                        repo.getOne({userName: 'bob'}, function (err, res1) {
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

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
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

            userRepo.create(user, function () {
                userRepo.update({userName: 'chuck'}, {'$set': {userName: 'bob'}}, function (err, res) {
                    expect(res).toBeDefined();
                    expect(res).toBe(1);

                    userRepo.getOne({userName: 'bob'}, function (err, res1) {
                        expect(res1).toBeDefined();
                        expect(res1.userName).toBe('bob');
                        expect(res1.lastName).toBe('Norris');
                        expect(res1.email).toBe('chuck@norris.com');

                        done();
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

            userRepo.create(user, function (err, res) {
                res[0].userName = 'bob';

                userRepo.update({userName: 'chuck'}, {'$set': res[0]}, function (err, res) {
                    expect(res).toBeDefined();
                    expect(res).toBe(1);

                    userRepo.getOne({userName: 'bob'}, function (err, res1) {
                        expect(res1).toBeDefined();
                        expect(res1.userName).toBe('bob');
                        expect(res1.lastName).toBe('Norris');
                        expect(res1.email).toBe('chuck@norris.com');

                        res1.lastName = 'Wayne';

                        userRepo.update({userName: 'bob'}, res1, function (err, res2) {
                            expect(res2).toBeDefined();
                            expect(res2).toBe(1);

                            userRepo.getOne({lastName: 'Wayne'}, function (err, res3) {
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

    describe('has a function delete() which', function () {
        it('should remove the document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'wayne'}, function () {
                    repo.delete({userName: 'chuck'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBe(1);

                        repo.getCount(function (err, res1) {
                            expect(res1).toBe(1);

                            repo.delete({userName: 'wayne'}, function (err, res2) {
                                expect(res2).toBeDefined();
                                expect(res2).toBe(1);

                                repo.getCount(function (err, res3) {
                                    expect(res3).toBe(0);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it('should remove nothing when the id is of wrong type', function (done) {
            userRepo.create(user, function () {
                userRepo.create({userName: 'wayne'}, function () {
                    userRepo.delete({_id: null}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBe(0);

                        userRepo.delete({_id: undefined}, function (err, res) {
                            expect(res).toBeDefined();
                            expect(res).toBe(0);

                            done();
                        });
                    });
                });
            });
        });

        it('should remove multiple documents of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'chuck'}, function () {
                    repo.getCount(function (err, res) {
                        expect(res).toBe(2);

                        repo.delete({userName: 'chuck'}, function (err, res1) {
                            expect(res1).toBe(2);

                            repo.getCount(function (err, res2) {
                                expect(res2).toBe(0);

                                done();
                            });
                        });
                    });
                });
            });
        });

        it('should throw an exception when params are of wrong type', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.delete(1, 2); };
            var func2 = function () { return repo.delete(null, null); };
            var func3 = function () { return repo.delete({}, null); };
            var func4 = function () { return repo.delete('wayne', function () {}); };
            var func5 = function () { return userRepo.delete({_id: '23422342'}, function () {}); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
        });
    });
});

