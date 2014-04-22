//dependencies for each module used
var express = require('express');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars');
var app = express();
//load environment variables
var dotenv = require('dotenv');
dotenv.load();

//fbgraph
var graph = require('fbgraph');
var util = require('util');


var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
    consumerKey: 'F9JxJoQtYCC9vmwSZ3c3hBNlu',
    consumerSecret: '7ROjhm5iqVMBWlRnAFqcUz2R3aYmZCIM2CLSqAtAVri6teegvw',
    callback: 'http://freq-cloud.herokuapp.com/twitter/cb'
});

app.get("/twitter/cb", function(req,res){
	twitter.getAccessToken(req.session.token, req.session.secret, req.query.oauth_verifier,
		function(error, accessToken, accessTokenSecret, results){
			
			req.session.oauth_verifier = req.query.oauth_verifier;
			req.session.accessToken = accessToken;
			req.session.accessSecret = accessTokenSecret;
			res.redirect("/graph");
	});
});

app.get("/twitter/auth", function(req,res){

	twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
    	if (error) {
        	console.log("Error getting OAuth request token : " + error);
    	} else {
    		req.session.token = requestToken;
    		req.session.secret = requestTokenSecret;
    		res.redirect("https://twitter.com/oauth/authenticate?oauth_token="+requestToken);
        //store token and tokenSecret somewhere, you'll need them later; redirect user
    	}
	});
});
app.get('/twitter/tweets', function(req, res) {
	//console.log(req.session, "SESSION")
					twitter.getTimeline("user_timeline", {}, 
						req.session.accessToken, req.session.accessSecret, function(error, data, response){
					req.session.tweets = data;
					res.end(JSON.stringify(data));
				});
})

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/');
}


//Configures the Template engine
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());
//more setting up configuration for express
//Allows cookie access and interaction
app.use(express.cookieParser() );
app.use(express.session({ secret: 'nyan cat'}));

//routes
app.get('/', function(req,res) { 
	res.render("index");
});

//fbgraph authentication
app.get('/auth/facebook', function(req, res) {
	if (!req.query.code) {
		var authUrl = graph.getOauthUrl({
			'client_id': '273635606130233',
			'redirect_uri': 'http://freq-cloud.herokuapp.com/auth/facebook',
			'scope': 'user_about_me,read_stream'//you want to update scope to what you want in your app
		});

		if (!req.query.error) {
			res.redirect(authUrl);
		} else {
			res.send('access denied');
		}
		return;
	}
	graph.authorize({
		'client_id': '273635606130233',
		'redirect_uri': 'http://freq-cloud.herokuapp.com/auth/facebook',
		'client_secret': '6c2304c6baf5c52a99715f9280256921',
		'code': req.query.code
	}, function( err, facebookRes) {
		res.redirect('/graph');
	});
});

app.get('/UserHasLoggedIn', function(req, res) {
	graph.get('me', function(err, response) {
		console.log(err); //if there is an error this will return a value
		data = { facebookData: response};
		res.render('facebook', data);
	});
});


app.get("/graph", function(req,res){
	res.render("graph");
})

app.get("/facebook/feed", function(req,res){
	graph.get("/me/posts", function(err,response){
		res.end(JSON.stringify(response.data));
	})
});

//set environment ports and start application
app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});