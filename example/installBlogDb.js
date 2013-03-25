var bbDb = require('../lib/lx-mongodb'),
    blogConnection = 'localhost/blog?w=1&journal=True&fsync=True',
    db = bbDb.GetDb(blogConnection),
    ObjectID = require('mongodb').ObjectID,
    importFile = require('./import.json');

// users
function createUsers(cb) {
    'use strict';

    var userCollection = db.collection('users');
    var users = importFile.users;
    var i, max;
    for (i = 0, max = users.length; i < max; i += 1) {
        users[i]._id = ObjectID.createFromHexString(users[i]._id);
        users[i].birthday = new Date(users[i].birthday);
    }

    userCollection.drop();
    userCollection.insert(users, {safe: true}, function (err, res) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('=======================');
            console.log('users');
            console.log('=======================');
            console.log(res);
            cb(null);
        }
    });
}

// tags
function createTags(cb) {
    'use strict';

    var tagCollection = db.collection('tags');
    var tags = importFile.tags;
    var i, max;
    for (i = 0, max = tags.length; i < max; i += 1) {
        tags[i]._id = ObjectID.createFromHexString(tags[i]._id);
    }

    tagCollection.drop();
    tagCollection.insert(tags, {safe: true}, function (err, res) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('=======================');
            console.log('tags');
            console.log('=======================');
            console.log(res);
            cb(null);
        }
    });
}

// categories
function createCategories(cb) {
    'use strict';

    var categoryCollection = db.collection('categories');
    var categories = importFile.categories;
    var i, max;
    for (i = 0, max = categories.length; i < max; i += 1) {
        categories[i]._id = ObjectID.createFromHexString(categories[i]._id);
        categories[i].created = new Date(categories[i].created);
    }

    categoryCollection.drop();
    categoryCollection.insert(categories, {safe: true}, function (err, res) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('=======================');
            console.log('categories');
            console.log('=======================');
            console.log(res);
            cb(null);
        }
    });
}

// comments
function createComments(cb) {
    'use strict';

    var commentCollection = db.collection('comments');
    var comments = importFile.comments;
    var i, max;
    for (i = 0, max = comments.length; i < max; i += 1) {
        comments[i]._id = ObjectID.createFromHexString(comments[i]._id);
        comments[i].author = ObjectID.createFromHexString(comments[i].author);
        comments[i].created = new Date(comments[i].created);
    }

    commentCollection.drop();
    commentCollection.insert(comments, {safe: true}, function (err, res) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('=======================');
            console.log('comments');
            console.log('=======================');
            console.log(res);
            cb(null);
        }
    });
}
// posts
function createPosts(cb) {
    'use strict';

    var postCollection = db.collection('posts');
    var posts = importFile.posts;
    var i, max, y, max2, k, max3;
    for (i = 0, max = posts.length; i < max; i += 1) {
        posts[i]._id = ObjectID.createFromHexString(posts[i]._id);
        posts[i].author = ObjectID.createFromHexString(posts[i].author);
        posts[i].category = ObjectID.createFromHexString(posts[i].category);
        posts[i].created = new Date(posts[i].created);

        for (y = 0, max2 = posts[i].tags.length; y < max2; y += 1) {
            posts[i].tags[y]._id = ObjectID.createFromHexString(posts[i].tags[y]._id);
        }

        for (k = 0, max3 = posts[i].comments.length; k < max3; k += 1) {
            posts[i].comments[k]._id = ObjectID.createFromHexString(posts[i].comments[k]._id);
        }
    }

    postCollection.drop();
    postCollection.insert(posts, {safe: true}, function (err, res) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('=======================');
            console.log('posts');
            console.log('=======================');
            console.log(res);
            cb(null);
        }
    });
}
createUsers(function () {
    'use strict';

    createTags(function () {
        createCategories(function () {
            createComments(function () {
                createPosts(function () {
                    console.log('=======================');
                    console.log('import finished');
                    console.log('=======================');
                    db.close();
                });
            });
        });
    });
});




