// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 80;        // set our port

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('db connected!');
});

var User = require('./app/models/user');

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening..');
	next();
});


// test route to make sure everything is working (accessed at GET http://localhost/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});


router.route('/signup')
.post(function(req, res) {
	var user = new User();
	user.name = req.body.username;
	user.favorites = [];
	console.log('login username : ' + req.body.username);
	console.log(req.body);

	user.save(function(err){
		if (err) {
			console.log('Error' + err);
			res.send(err);
		}
		res.status(200);
		res.send({username: user.name, session_id : user._id, favorites : user.favorites});
	});
})
.get(function(req, res) {
	User.find(function(err, users) {
		if (err)
			res.send(err);
		res.send(users);
	})
});


var promiseFunc = function(opts) {
	var q = require('q');
	var defer = q.defer();
	var request = require('request');

	if (!opts) {
		defer.reject('Please Specify the opts data');
	} else {
		request(opts, function(err, resp, body) {
			if (err) {
				defer.reject(err);
				console.log('+ REQUEST FAILED!!!');
				return defer.promise;
			}
			console.log('+ REQUEST SUCCESS!!!');
			defer.resolve(body);
		});
	}
	return defer.promise;
}

router.route('/recommendations')
.get(function(req,res){
	var request = require('request');


	// will move to somewhere else..
	var wordsList = [
			'Help',	'Love', 'Hate', 'Desperate', 'Open', 'Close', 'Baby', 'Girl', 'Yeah', 'Whoa', 'Start', 'Finish', 'Beginning', 'End',
			'Fight', 'War', 'Running', 'Want', 'Need', 'Fire', 'Myself', 'Alive', 'Life', 'Dead', 'Death', 'Kill', 'Different', 'Alone',
			'Lonely', 'Darkness', 'Home', 'Gone', 'Break', 'Heart', 'Floating', 'Searching', 'Dreaming', 'Serenity', 'Star', 'Recall',
			'Think', 'Feel', 'Slow', 'Speed', 'Fast', 'World', 'Work', 'Miss', 'Stress', 'Please', 'More', 'Less', 'only', 'World', 'Moving',
			'lasting', 'Rise', 'Save', 'Wake', 'Over', 'High', 'Above', 'Taking', 'Go', 'Why', 'Before', 'After', 'Along', 'See', 'Hear',	'Feel', 'Change', 'Body', 'Being', 'Soul', 'Spirit', 'God', 'Angel', 'Devil', 'Demon', 'Believe', 'Away', 'Everything', 'Shared',
			'Something', 'Everything', 'Control', 'Heart', 'Away', 'Waiting', 'Loyalty', 'Shared', 'Remember', 'Yesterday', 'Today', 'Tomorrow',
			'Fall', 'Memories', 'Apart', 'Time', 'Forever', 'Breath', 'Lie', 'Sleep', 'Inside', 'Outside', 'Catch', 'Be', 'Pretending'
	];

	var selectWords = function(max) {
		if(!max || isNaN(max) || max < 1) max = 1;
			var howMany = Math.ceil(Math.random() * max);
			var listLength = wordsList.length;
			var words = [];
			for(var i = 0; i < howMany; i++) {
				var r = Math.floor(Math.random() * listLength);
				words.push(wordsList[r]);
			}
		return words;
	};

	var getSearchUrl = function() {
		var words = selectWords(1);
		var offset = Math.ceil(Math.random() * 3);
		var url = 'https://api.spotify.com/v1/search?type=track&limit=10&offset=' + offset + '&q=' + words.join('%20');
		return url;
	};
	///End of move point


	var getAccessToken = function() {
		var clientId = 'ee5447b7a33f4beda0e313ba183c29fa';
		var clientSecret = '48fc3a3c4f15466c93ad3b697685c5e4';
		var payload = clientId + ":" + clientSecret;
		var encodedPayload = new Buffer(payload).toString("base64");
		var opts = {
			url: "https://accounts.spotify.com/api/token",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": "Basic " + encodedPayload
			},
			body : "grant_type=client_credentials&scope=playlist-modify-public playlist-modify-private"
		};

		return promiseFunc(opts);
	};

	var getSongList = function(accessToken, searchUrl) {
		console.log('searchUrl : ' + searchUrl)
		var opts = {
			url : searchUrl,
			//url : "https://api.spotify.com/v1/browse/new-releases",
			method : "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": "Bearer " + accessToken
			}
		}

		return promiseFunc(opts);
	}


	getAccessToken().then(function(body) {
		var info = JSON.parse(body);
		console.log('access_token : ', info.access_token);
		return getSongList(info.access_token, getSearchUrl());
	})
	.then(function(body) {
		var resp = JSON.parse(body);
		var tracks = resp.tracks;
		var nItem = Math.min(resp.tracks.total, resp.tracks.limit);
		var result = new Array();

		//console.log('body : ' + body);
		console.log('nItem : ' + nItem)
		console.log('tracks.items.length : ' + tracks.items.length)

		if (nItem == 0) {
			result.push( { 'error' : 'there is no track for now..'} );
		} else {
			for (var i=0; i < tracks.items.length; i++) {
				var item = {};
				item['title'] = tracks.items[i].name;
				item['artist'] = tracks.items[i].artists[0].name;
				item['preview_url'] = tracks.items[i].preview_url;
				//item['albumName'] = tracks.items[i].album.name;
				item['image_large'] = tracks.items[i].album.images[0].url;
				item['image_medium'] = tracks.items[i].album.images[0].url;
				item['image_small'] = tracks.items[i].album.images[0].url;
				item['open_url'] = tracks.items[i].uri;
				item['song_id'] = tracks.items[i].id;
				
				result.push(item);
			}
		}
		
		res.send(result);
	})
	.catch(function(err) {
		console.log('Error occurred : ' + err);
		res.send(err);
	})
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);