
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name : String,
	favorites : [
	    { 
		title : String,
		artist : String,
		preview_url : String,
		image_small : String,
		image_medium : String,
		image_large : String,
		open_url : String,
		song_id : String
		}
	]
});

module.exports = mongoose.model('User', UserSchema);