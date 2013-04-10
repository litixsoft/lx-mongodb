var bbDb = require('../index.js'),
    blogConnection = 'localhost/blog?w=1&journal=True&fsync=True',
    //blogConnection = '192.168.20.24,192.168.20.25,192.168.20.26/blog?w=2&journal=True&fsync=True',
    blog = require('./repositories/blog').BlogRepository(bbDb, blogConnection);

function callback(err, res) {
    'use strict';

    if (err) {
        console.error('Application Error: ' + err);
    }
    else if (res) {
        console.dir(res);
    } else {
        console.dir('No Data!');
    }
}

//blog.posts.getOne({_id:'511106fc574d81d815000001'}, callback);
//blog.posts.getOneById('511106fc574d81d815000001', callback);
//blog.posts.getAll({limit: 3}, callback);
//blog.posts.getTitles(callback);
//blog.posts.getOneById_WR('511106fc574d81d815000001', callback);
//blog.posts.getPostComments_WR('511106fc574d81d815000001', callback);

//blog.tags.getAll(callback);
//blog.categories.getAll(callback);

//blog.comments.getOneById('511101e32623fa581d000003', callback);
//blog.comments.getOneById_WR('511101e32623fa581d000003', callback);

/**
 var comment = {
    _id: '5116c0ed70a3ec6817000001',
    subject:'This is coment 11',
    body:'This is the body of comment 11.',
    author:'5110f99045a6b93015000004',
    created:new Date()
};
 **/
//blog.posts.createComment('511106fc574d81d815000001',comment, callback);
//blog.posts.deleteComment('511106fc574d81d815000001','5116c0ed70a3ec6817000001', callback);

//blog.comments.getAll(callback);
//blog.comments.update({_id:'5114cefe35b7e4680d000001'},{$set:{body:'Den Body leicht geändert'}},callback);
//blog.comments.delete({_id:'5116bd049e8bbe2412000001'}, callback);
//blog.posts.getAll(callback);

//blog.users.getAll(callback);
//blog.users.getOne({_id:'5110f99045a6b93015000007'}, callback);
//blog.users.getOneById('5110f99045a6b93015000007', callback);
//
var user = {
    'userName': 'diiimo_3',
    'firstName': 'Timo_1',
    'lastName': 'Liebetrau_1',
    'birthdate': '1973-06-01T15:49:00.000Z',
    'email': 'diiimo_3@gmail.com',
    'prop': 66
};

//blog.users.update({userName: 'diiimo_1'}, user, callback());

//blog.posts.getOne({'comments._id': '5114cefe35b7e4680d000001'}, callback);

blog.users.getCollection().drop();

//blog.users.delete({userName: user.userName}, callback);
blog.users.validate(user, false, blog.users.getSchema(), function(err, res) {
    console.dir(res);

    blog.users.create(user, callback);
});
//blog.users.update({userName: user.userName},{$set:{firstName: 'Timo_112',lastName: 'Liebetrau:112'}}, callback);
//blog.users.update({userName:'diiimo_112'},{$set:{firstName:'Timo_112',lastName:'Liebetrau:112'}},callback);
//blog.users.getOne({userName:'diiimo_112'},callback);
//blog.users.delete({userName:'diiimo_112'}, callback);

//blog.users.checkUserName('diiimo_1', callback);

//blog.posts.getTitles(callback);