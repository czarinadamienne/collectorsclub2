const mongoose = require('mongoose');
const { boolean } = require('webidl-conversions');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const postS = new Schema({
    user: { type: ObjectId, ref: 'User' },
    tag: String,
    caption: String,
    likes: Number,
    dislikes: Number,
    photo: String,
    comments: [{user: { type: ObjectId, ref: 'User' },
    comment: String, date: Date}],
    reported: Boolean,
    dateposted: Date
});

const Post = mongoose.model('Post', postS);
module.exports = Post;