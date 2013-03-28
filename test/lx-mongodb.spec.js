/*global describe, it, expect, beforeEach */
'use strict';

var sut = require('../lib/lx-mongodb');
var connectionString = 'localhost/blog?w=1&journal=True&fsync=True';
var user = {
    firstName: 'Chuck',
    lastName: 'Norris',
    userName: 'chuck',
    email: 'chuck@norris.com',
    birthdate: new Date(2000, 10, 10)
};

beforeEach(function() {
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
            var func7 = function () { return sut.GetDb(connectionString, ''); };

            expect(func1).toThrow();
            expect(func2).toThrow();
            expect(func3).toThrow();
            expect(func4).toThrow();
            expect(func5).toThrow();
            expect(func6).toThrow();
            expect(func7).toThrow();
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
    it('should throw an exception if parameter collection is empty', function () {
        var func1 = function () { return sut.BaseRepo(null); };
        var func2 = function () { return sut.BaseRepo(undefined); };
        var func3 = function () { return sut.BaseRepo(false); };
        var func4 = function () { return sut.BaseRepo(); };

        expect(func1).toThrow();
        expect(func2).toThrow();
        expect(func3).toThrow();
        expect(func4).toThrow();
    });

    describe('has a function create() which', function () {
        it('should insert a new record in the db', function (done) {
            var db = sut.GetDb(connectionString);
            var repo = sut.BaseRepo(db.users);
            db.users.drop();

            repo.create(user, function(error, result) {
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
    });
});

