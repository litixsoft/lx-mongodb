/*global describe, it, expect, runs, waitsFor */
describe('MongoJs specs', function () {
    'use strict';
    var bbDb = require('../lib/lx-mongodb'),
        blogConnection = 'localhost/blog?w=1&journal=True&fsync=True',
        db = bbDb.GetDb(blogConnection, ['users', 'posts', 'tags', 'categories', 'comments']),
        value,
        flag;

    it('should support async execution of test preparation and exepectations', function () {
        runs(function () {
            flag = false;
            value = 0;

            db.users.find({userName: 'diiimo_7'}, function (err, res) {
                console.log(res[0].email);
                value = res[0].email;
                flag = true;
            });
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            expect(value).toBe('diiimo_7@gmail.com');
        });
    });
});
