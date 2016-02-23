var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var sequelize = new Sequelize('blogapplication', 'timvanlent', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});

var User = sequelize.define('user', {
	username: Sequelize.STRING,
	password: Sequelize.STRING,
	email: Sequelize.STRING
});

var Blog = sequelize.define('blog', {
	title: Sequelize.STRING,
	body: Sequelize.TEXT,
});

var Comment = sequelize.define('comment', {
	comment: Sequelize.TEXT,
}, {
	timestamps: true
});

Blog.hasMany(Comment);
Comment.belongsTo(User);
User.hasMany(Blog);

var app = express();

app.use(session({
	secret: 'fakka',
	resave: true,
	saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'jade');


// app.get('/blog/:blogId', function(req, res) {
// 	if (req.session.user != undefined) {
// 		var blogID = req.params.blogId;
// 		console.log('blogID:' + blogID)
// 		Blog.findById(blogID)
// 			.then(Comment.findAll({
// 					where: {
// 						blogId: blogID
// 					}
// 				}).then(function(comments) {
// 					console.log(comments)
// 					var comments = comments.map(function(row) {
// 						return {
// 							id: row.dataValues.id,
// 							comment: row.dataValues.comment,
// 						}
// 					})
// 				}).then(function() {
// 					res.redirect('/', {
// 						blogID: blogID,
// 						// comments: comments
// 					})
// 				}));
// 		} else {
// 			res.redirect('/')
// 		}
// });

app.get('/', function(req, res) {
	Promise.all([ //
		Blog.findAll(),
		Comment.findAll(),
		User.findAll()
	]).then(function(entities) {

		var blogs = entities[0].map(function(row) {

			return {
				id: row.dataValues.id,
				body: row.dataValues.body,
				title: row.dataValues.title,
				userId: row.dataValues.userId
			};
		});

		var users = entities[2].map(function(row) {
			return {
				id: row.dataValues.id,
				username: row.dataValues.username,
				email: row.dataValues.email,
				password: row.dataValues.password
			};
		});

		res.render('index', {
			blogs: blogs,
			users: users,
			// comments : comments,
			message: req.query.message,

			user: req.session.user
		});
	});
});

app.get('/blog/:blogId', function(req, res) {
	Promise.all([ //
		Blog.findAll(),
		Comment.findAll(),
		User.findAll()
	]).then(function(entities) {

		var blogs = entities[0].map(function(row) {

			return {
				id: row.dataValues.id,
				body: row.dataValues.body,
				title: row.dataValues.title,
				userId: row.dataValues.userId,
			};

		});
		console.log(blogs);
		blogID = req.params.blogId;
		console.log('blogID:' + blogID)

		var comments = []
		Blog.findById(blogID).then(Comment.findAll({
			where: {
				blogId: blogID
			}
		}).then(function(commentaar) {
			var data = entities[1].map(function(row) {
				return {
					id: row.dataValues.id,
					comment: row.dataValues.comment
				}

			})
				comments = data.reverse();
				console.log('comments innerfunction')
				console.log(comments);
			if (comments.length === 0) {
				comments = ['no comments']
				console.log(comments)
			}

		}));
		var users = entities[2].map(function(row) {
			return {
				id: row.dataValues.id,
				username: row.dataValues.username,
				email: row.dataValues.email,
				password: row.dataValues.password
			};
		});
		console.log('comments:');
		console.log(comments);
		console.log('rendering:');

		res.render('blog', {
			blogs: blogs,
			users: users,
			comments: comments,
			message: req.query.message,
			user: req.session.user,
			blogId: blogID
		});
	});
});

app.get('/logout', function(req, res) {
	req.session.destroy(function(error) {
		if (error) {
			throw error;
		}
		res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
});

app.post('/login', bodyParser.urlencoded({
		extended: true
	}),
	function(req, res) {
		console.log("finding");
		User.findOne({
			where: {
				username: req.body.username,
				password: req.body.password
			}
		}).then(function(user) {
			if (req.body.password === user.password) {
				req.session.user = user;
				res.redirect('/?message=' + encodeURIComponent("logged in as " + req.body.username))
				console.log(user.dataValues);
			}
		});
	});

app.post('/register', bodyParser.urlencoded({
	extended: true
}), function(req, res) {
	console.log("registering user :");

	User.create({

		username: req.body.addUser,
		password: req.body.addPass,
		email: req.body.addEmail

	}).then(function(user) {

		res.redirect('/?message=' + encodeURIComponent("Sup " + req.body.addUser));
	});
});
//----------------------------------------------------------
app.post('/blogs', bodyParser.urlencoded({
	extended: true
}), function(req, res) {

	Blog.create({
		title: req.body.title,
		body: req.body.body,
		userId: req.session.user.id
	}).then(function(rows) {
		console.log(rows.dataValues)
		res.redirect('/');
	});
});



app.post('/comment', bodyParser.urlencoded({
	extended: true
}), function(req, res) {
	Comment.create({
		comment: req.body.comment,
		userId: req.session.user.id,
		blogId: blogID
	}).then(function(rows) {
		console.log(rows.dataValues)
		res.redirect('/blog/' + blogID);
	});
});


sequelize.sync({
	force: false
}).then(function() {
	var server = app.listen(3000, function() {
		console.log('Example app listening on port: ' + server.address().port);
	});
})