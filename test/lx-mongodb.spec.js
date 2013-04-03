/*global describe, it, expect, beforeEach */
'use strict';

var ObjectID = require('mongodb').ObjectID;
var sut = require('../lib/lx-mongodb');
var connectionString = 'localhost/blog?w=1&journal=True&fsync=True';
var user = {
    firstName: 'Chuck',
    lastName: 'Norris',
    userName: 'chuck',
    email: 'chuck@norris.com',
    birthdate: new Date(2000, 10, 10)
};

beforeEach(function () {
    // clear db
    var db = sut.GetDb(connectionString, ['users', 'posts', 'tags', 'categories', 'comments']);
    db.users.drop();
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

    it('has a default idField "_id"', function () {
        var repo = sut.BaseRepo('users');

        expect(repo.getIdFieldName()).toBe('_id');
    });

    it('has a default defaultSortField "_id"', function () {
        var repo = sut.BaseRepo('users');

        expect(repo.getDefaultSortFieldName()).toBe('_id');
    });

    it('has a function getCollection() which should return the collection', function () {
        var db = sut.GetDb(connectionString);
        var repo = sut.BaseRepo(db.users);
        var repo2 = sut.BaseRepo(db.categories);

        expect(typeof repo.getCollection()).toBe('object');
        expect(typeof repo2.getCollection()).toBe('object');
    });

    it('has a function createNewId() which should return a new mongo ObjectID', function () {
        var repo = sut.BaseRepo('users');

        expect(typeof repo.createNewId()).toBe('object');
        expect(repo.createNewId() instanceof ObjectID).toBeTruthy();
    });

    it('has a function convertId() which should convert a mongo ObjectID to a string and vice versa', function () {
        var repo = sut.BaseRepo('users');
        var id = '5108e9333cb086801f000035';
        var _id = new ObjectID(id);

        expect(typeof repo.convertId(id)).toBe('object');
        expect(repo.convertId(id) instanceof ObjectID).toBeTruthy();

        expect(typeof repo.convertId(_id)).toBe('string');
        expect(repo.convertId(_id)).toBe(id);
    });

    it('has a function getCount() which should return the number of documents of the collection in the BaseRepo', function (done) {
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

    describe('has a function setDefaultSortField() which', function () {
        it('should set the defaultSortField of the BaseRepo', function () {
            var repo = sut.BaseRepo('users');
            repo.setDefaultSortField('name');

            expect(repo.getDefaultSortFieldName()).toBe('name');
        });

        it('should throw an exception when the param "defaultSortFieldName" is not of type String', function () {
            var repo = sut.BaseRepo('users');
            var func1 = function () { return repo.setDefaultSortField(); };
            var func2 = function () { return repo.setDefaultSortField([]); };
            var func3 = function () { return repo.setDefaultSortField({}); };
            var func4 = function () { return repo.setDefaultSortField(1); };
            var func5 = function () { return repo.setDefaultSortField(new Date()); };
            var func6 = function () { return repo.setDefaultSortField(function () {}); };
            var func7 = function () { return repo.setDefaultSortField(null); };
            var func8 = function () { return repo.setDefaultSortField(undefined); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
            expect(func6).toThrow();
            expect(func7).toThrow();
            expect(func8).toThrow();
        });
    });

    describe('has a function setIdField() which', function () {
        it('should set the id field of the BaseRepo', function () {
            var repo = sut.BaseRepo('users');
            repo.setIdField('id');

            expect(repo.getIdFieldName()).toBe('id');
        });

        it('should throw an exception when the param "idFieldName" is not of type String', function () {
            var repo = sut.BaseRepo('users');
            var func1 = function () { return repo.setIdField(); };
            var func2 = function () { return repo.setIdField([]); };
            var func3 = function () { return repo.setIdField({}); };
            var func4 = function () { return repo.setIdField(1); };
            var func5 = function () { return repo.setIdField(new Date()); };
            var func6 = function () { return repo.setIdField(function () {}); };
            var func7 = function () { return repo.setIdField(null); };
            var func8 = function () { return repo.setIdField(undefined); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
            expect(func6).toThrow();
            expect(func7).toThrow();
            expect(func8).toThrow();
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
            var func5 = function () { return repo.create(null, function () {}); };

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

        it('should return no document when the query not matches any document of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.getOneById('5108e9333cb086801f000035', function (err, res) {
                expect(res).toBeDefined();
                expect(res).toBeNull();

                done();
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
                    repo.update({userName: 'chuck'}, {userName: 'bob'}, function (err, res) {
                        expect(res).toBeDefined();
                        expect(res).toBe(1);

                        repo.getOne({userName: 'bob'}, function (err, res1) {
                            expect(res1).toBeDefined();
                            expect(res1.userName).toBe('bob');

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

                            repo.delete({userName: 'wayne'}, true, function (err, res2) {
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

        it('should remove multiple documents of the collection', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            repo.create(user, function () {
                repo.create({userName: 'chuck'}, function () {
                    repo.getCount(function (err, res) {
                        expect(res).toBe(2);

                        repo.delete({userName: 'chuck'}, false, function (err, res1) {
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

        it('should throw an exception when the number of params is less than 2', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.delete(1); };
            var func2 = function () { return repo.delete(); };

            expect(func1).toThrow();
            expect(func2).toThrow();
        });

        it('should throw an exception when params are of wrong type', function () {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);

            var func1 = function () { return repo.delete(1, 2); };
            var func2 = function () { return repo.delete({}, null); };
            var func3 = function () { return repo.delete('wayne', function () {}); };
            var func4 = function () { return repo.delete({}, 1, function () {}); };
            var func5 = function () { return repo.delete(1, true, function () {}); };
            var func6 = function () { return repo.delete(1, true, function () {}); };
            var func7 = function () { return repo.delete({}, true, 1); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
            expect(func6).toThrow();
            expect(func7).toThrow();
        });
    });
});

