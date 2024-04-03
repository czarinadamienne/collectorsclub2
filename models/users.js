const mongoose = require('mongoose');
const { boolean } = require('webidl-conversions');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const passportLocalMongoose = require("passport-local-mongoose");

const userS = new Schema({
    username: String,
    password: String,
    email: String, 
    bio: String,
    pfp: String, 
    admin: Boolean,
    followers: [{user: { type: ObjectId, ref: 'User' }}],
    following: [{user: { type: ObjectId, ref: 'User' }}],
    liked: [{post: {type: ObjectId, ref: 'Post'}}],
    disliked: [{post: {type: ObjectId, ref: 'Post'}}]
});

userS.plugin(passportLocalMongoose);
const User = mongoose.model('User', userS);
module.exports = User;