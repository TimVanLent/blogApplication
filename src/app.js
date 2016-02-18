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

var app = express();

app.use(session({
	secret: 'fakka',
	resave: true,
	saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
	res.render('index', {
		message: req.query.message,
		user: req.session.user
	})
});

app.get('/logout', function (req, res) {
	req.session.destroy(function(error){
		if(error) {
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
	}).then(function (user){
		if(req.body.password === user.password){
			req.session.user = user;
			res.redirect('/?message=' + encodeURIComponent("logged in as " + req.body.username))
			console.log(user.dataValues);			
		}
	});
});

app.post('/register', bodyParser.urlencoded({ extended: true }), function(req, res) {
	console.log("registering user :");
	sequelize.sync({force: true}).then(function() {
		User.create({

					username: req.body.addUser,
					password: req.body.addPass,
					email: req.body.addEmail		
				
				}).then(function (user){
					
					res.redirect('/?message=' + encodeURIComponent("Sup " + req.body.addUser));
			});
		}); 
});

	var server = app.listen(3000, function() {
		console.log('Example app listening on port: ' + server.address().port);
	});
