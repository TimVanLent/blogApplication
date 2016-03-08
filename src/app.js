var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');
var fs = require('fs')

var sequelize = new Sequelize('blogapplication', 'timvanlent', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});

var User = sequelize.define('user', {
	username: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false
	},
	password: Sequelize.STRING,
	email: Sequelize.STRING
});

var Blog = sequelize.define('blog', {
	title: Sequelize.STRING,
	body: Sequelize.TEXT,
	userId: {
		type: Sequelize.STRING,
		references: {
			model: User,
			key: "username"
		}
	}
});

var Comment = sequelize.define('comment', {
	comment: Sequelize.TEXT,
	userId: {
		type: Sequelize.STRING,
		references: {
			model: User,
			key: "username"
		}
	}
});

Blog.hasMany(Comment);
User.hasMany(Comment, {
	targetKey: 'username'
});
User.hasMany(Blog, {
	targetKey: 'username'
});

var app = express();

app.use(express.static('./src/views'));

app.use(session({
	secret: 'fakka',
	resave: true,
	saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
	Promise.all([ //
		Blog.findAll(),
		User.findAll(),
	]).then(function(entities) {

		var data = entities[0].map(function(row) {

			return {
				id: row.dataValues.id,
				body: row.dataValues.body,
				title: row.dataValues.title,
				userId: row.dataValues.userId
			};

		});

		var blogs = data.reverse()
		var users = entities[1].map(function(row) {
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
			message: req.query.message,
			user: req.session.user
		});
	});
});

app.get('/blog/:blogId', function(req, res) {
	Promise.all([ //
		Blog.findAll(),
		User.findAll()
	]).then(function(entities) {

		var data = entities[0].map(function(row) {

			return {
				id: row.dataValues.id,
				body: row.dataValues.body,
				title: row.dataValues.title,
				userId: row.dataValues.userId,
			};

		});
		blogs = data.reverse();

		users = entities[1].map(function(row) {
			return {
				id: row.dataValues.id,
				username: row.dataValues.username,
				email: row.dataValues.email,
				password: row.dataValues.password
			};
		});
	});

	blogID = req.params.blogId;
	Blog.findById(blogID).then(Comment.findAll({
		where: {
			blogId: blogID
		}
	}).then(function(commentaar) {
		comments = commentaar.map(function(row) {
			return {
				id: row.dataValues.id,
				comment: row.dataValues.comment,
				userId: row.dataValues.userId
			}

		})
		if (comments.length > 0) {
			res.render('blog', {
				blogs: blogs,
				users: users,
				comments: comments,
				message: req.query.message,
				user: req.session.user,
				blogId: blogID,
				userId: req.session.user.id

			});
		} else {
			comments = ['no comments']
			res.render('blog', {
				blogs: blogs,
				users: users,
				comments: comments,
				message: req.query.message,
				user: req.session.user,
				blogId: blogID,
				userId: req.session.user.id
			});
		}

	}))

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
		User.findOne({
			where: {
				username: req.body.username
			}
		}).then(function(user) {
			bcrypt.compare(req.body.password, user.password, function(err, result) {
				if (err !== undefined) {
					console.log(err);
				} else {
					console.log(result)
					if (user !== null && result === true) {
						req.session.user = user;
						res.redirect('/?message=' + encodeURIComponent("logged in as " + req.body.username))
					} else {
						res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
					}
				}
			})
		}, function(error) {
			res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		})

	});

app.post('/register', bodyParser.urlencoded({
	extended: true
}), function(req, res) {
	console.log("registering user :");

	bcrypt.hash(req.body.addPass, 8, function(err, hash) {
		if (err !== undefined) {
			console.log(err);
		} else {
			User.create({

				username: req.body.addUser,
				password: hash,
				email: req.body.addEmail

			}).then(function(user) {

				res.redirect('/?message=' + encodeURIComponent("Sup " + req.body.addUser));
			}, function(error) {
				res.redirect('/?message=' + encodeURIComponent("Username already exists"));
			});

		}
	});
});
//----------------------------------------------------------
app.post('/blogs', bodyParser.urlencoded({
	extended: true
}), function(req, res) {
	Blog.create({
		title: req.body.title,
		body: req.body.body,
		userId: req.session.user.username
	}).then(function(rows) {
		res.redirect('/blog/' + rows.dataValues.id + '#' + rows.dataValues.id);
	});
});



app.post('/comment', bodyParser.urlencoded({
	extended: true
}), function(req, res) {
	Comment.create({
		comment: req.body.comment,
		userId: req.session.user.username,
		blogId: blogID
	}).then(function(rows) {
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