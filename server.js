require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/users');
const Post = require('./models/posts');
const moment = require('moment');
const multer  = require('multer');
const momentt = require('moment-timezone');
const path = require('path');
const session = require("express-session");
const passport = require("passport");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
});


const upload = multer({ storage: storage });
const app = express();


const atlas = "mongodb+srv://czarinadamienneang:" + process.env.ATLAS_PASSWORD + "@cluster0.jusatue.mongodb.net/collectors";
mongoose.connect(atlas)
    .then((result) => console.log('connected to db'))
    .catch((err) => console.log(err));

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


global.formatDate = function(date) {
    return momentt(date).format('MM-DD-YYYY HH:mm:ss');
};

app.get('/', (req, res) => {
    res.render('index',{ title: 'The Collectors Club'});
});

app.get('/aboutus', (req, res) => {
    const loguser = req.query.loguser;
    var link;
    if(req.isAuthenticated()){
        link = `/viewfeed?status=fyp&loguser=${loguser}`;
    }
    else{
        link = "/";
    }
    res.render('aboutus', { 
        title: 'The Collectors Club | About Us', 
        link: link,
        loguser: loguser 
     });
});


app.get('/login', (req, res) => {
    res.render('login', {title: 'The Collectors Club | Login', errormsg: null});
});

app.post('/viewfeed', async(req, res) => {
    const loguser = new User({
        username: req.body.username,
        password: req.body.password
    });

    try {
        const user = await User.findOne({ username: loguser.username });

        if (user) {
            passport.authenticate('local')(req, res, function () {
                res.redirect(`/viewfeed?status=fyp&loguser=${loguser.username}`);
            });
        } else {
            res.render('login', { title: 'The Collectors Club | Login', errormsg: 'Invalid credentials!' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).render('error', {
            title: 'The Collectors Club | Error',
            error: '500 Error: Internal Server Error'
        });
    }

});


app.get('/signup', (req, res) => {
    res.render('signup', {title: 'The Collectors Club | Signup', message: null});
});

app.post('/add', async (req, res) => {
    try {
        const existu = await User.findOne({ username: req.body.username });
        if (existu) {
            return res.render('signup', { title: 'The Collectors Club | Signup', message: 'Username taken!' });
        }

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            bio: "",
            pfp: "default.png",
            admin: false,
            followers: [],
            following: [],
            liked: [],
            disliked: []
        });

        User.register(newUser, req.body.password, function(err, nuser) {
            if (err) {
                console.log(err);
                return res.status(500).render('error', {
                    title: 'The Collectors Club | Error',
                    error: '500 Error: Internal Server Error'
                });
            }

            passport.authenticate("local")(req, res, function() {
                res.redirect('login');
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).render('error', {
            title: 'The Collectors Club | Error',
            error: '500 Error: Internal Server Error'
        });
    }
});


app.get('/rules', (req, res) => {
    const loguser = req.query.loguser;
    var link;
    if(req.isAuthenticated()){
        link = `/viewfeed?status=fyp&loguser=${loguser}`;
    }
    else{
        link = "/";
    }
    res.render('rules', { 
        title: 'The Collectors Club | Rules', 
        link: link,
        loguser: loguser 
    });
});

app.get('/viewfeed', (req, res) => {
    const status = req.query.status;
    const loguser = req.query.loguser;
    let u;

    if (req.isAuthenticated()) {
        User.findOne({ username: loguser })
            .then((user) => {
                if (!user) {
                    return res.render('error', {
                        title: 'The Collectors Club | Error',
                        error: 'User not found'
                    });
                }
                u = user;

                if (status === "fyp") {
                    return Post.find({ reported: false })
                        .populate('user')
                        .populate('comments.user')
                        .sort({ dateposted: -1 })
                        .then(posts => {
                            posts.forEach(post => {
                                post.comments.sort((a, b) => b.date - a.date);
                            });
                            return posts;
                        });

                } else if (status === "following") {
                    return User.findById(u._id)
                        .populate('following')
                        .then(async (cuserf) => {
                            const fusers = cuserf.following.map((follow) => follow.user);
                            const posts = await Post.find({ user: { $in: fusers }, reported: false })
                                .populate('user')
                                .populate('comments.user')
                                .sort({ dateposted: -1 });
                            posts.forEach(post => {
                                post.comments.sort((a, b) => b.date - a.date);
                            });
                            return posts;
                        });
                }
            })
            .then((posts) => {
                res.render('viewfeed', {
                    title: 'The Collectors Club | View Feed',
                    posts: posts,
                    loguser: u
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).render('error', {
                    title: 'The Collectors Club | Error',
                    error: '500 Error: Internal Server Error'
                });
            });
    } else {
        res.redirect("/");
    }
});

app.get('/subtopic', (req, res) => {
    const tag = req.query.tag;
    const loguser = req.query.loguser;
    let tposts;
    let u;
    if (req.isAuthenticated()) {
        User.findOne({ username: loguser })
            .then(async (user) => {
                if (!user) {
                    res.render('error', {
                        title: 'The Collectors Club | Error',
                        error: 'User not found'
                    });
                    return;
                }
                u = user;
                const posts = await Post.find({ tag: tag, reported: false }).populate('user').populate('comments.user').sort({ dateposted: -1 });
                posts.forEach(post => {
                    post.comments.sort((a, b) => b.date - a.date);
                });
                return posts;
            })
            .then((tagposts) => {
                tposts = tagposts;
                res.render('subtopic', {
                    title: 'The Collectors Club | ' + tag,
                    tag: tag,
                    posts: tposts,
                    loguser: u
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(404).render('error', {
                    title: 'The Collectors Club | Error',
                    error: '404 Error: Page not found'
                });
            });
    } else {
        res.redirect('/');
    }
});

app.get('/profile', (req, res) => {
    const userid = req.query.userid;
    const loguser = req.query.loguser;
    let curuser;
    let loginuser;
    if (req.isAuthenticated()) {
        User.findById(userid)
            .then(cuser => {
                if (!cuser) {
                    return res.status(404).render('error', {
                        title: 'The Collectors Club | Error',
                        error: 'User not found'
                    });
                }
                curuser = cuser;
                return User.findById(loguser);
            })
            .then(async login => {
                loginuser = login;
                const posts = await Post.find({ user: curuser })
                    .populate('user')
                    .populate('comments.user')
                    .sort({ dateposted: -1 });
                posts.forEach(post => {
                    post.comments.sort((a, b) => b.date - a.date);
                });
                return posts;
            })
            .then(posts => {
                res.render('profile', {
                    title: 'The Collectors Club | ' + curuser.username,
                    user: curuser,
                    loguser: loginuser,
                    posts: posts
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).render('error', {
                    title: 'The Collectors Club | Error',
                    error: '500 Error: Internal Server Error'
                });
            });
    } else {
        res.redirect('/');
    }
});



app.delete('/del', (req, res) => {
    const deluser = req.body.user;
    console.log(deluser);
    User.findOneAndDelete({ username: deluser })
        .then(duser => {
            if (!duser) {
                res.status(404).json({ error: 'User not found' });
            } else {
                res.status(200).json({ message: 'User deleted successfully' });
            }
        }).catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error deleting user' });
        });
});

app.get('/follow', (req, res) =>{
    const loguser= req.query.loguser;
    let loginuser;
    User.findById(loguser).populate('followers.user').populate('following.user')
        .then(logguser => {
            if(!logguser){
                res.render('error', {
                    title: 'The Collectors Club | Error',
                    error: 'User not found'
                });
            }
            loginuser = logguser;
            res.render('follow', {
                title: 'The Collectors Club | Following & Followers',
                loguser: loginuser
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('error', {
                title: 'The Collectors Club | Error',
                error: '500 Error: Internal Server Error'
            });
        });
});

app.post('/editprof', (req, res) => {
    let bio = req.body.bio;
    const loguser = req.body.user;
    
    if (bio === null) {
        return res.status(400).json("Email cannot be null or undefined.");
    }

    if (typeof bio !== 'string') {
        bio = String(bio);
    }

    User.findOneAndUpdate({ username: loguser }, { $set: { bio: bio } })
        .then(() => {
            res.status(200).json({ message: 'User updated successfully' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error updating' });
        });
});

app.get('/logout', (req, res) => {
    req.logout(function(err){
        if (err){}
        res.redirect('/login');
    });
});

app.get('/followcheck', (req, res) =>{
    const loguser = req.query.loguser;
    const userid = req.query.userid;

    User.findById(loguser)
    .then(logguser => {
        if (!logguser) {
            return res.render('error', {
                title: 'The Collectors Club | Error',
                error: 'User not found'
            });
        }

        User.findById(userid)
            .then(user => {
                if (!user) {
                    return res.render('error', {
                        title: 'The Collectors Club | Error',
                        error: 'User to follow not found'
                    });
                }
                var isFollowing = logguser.following.some(follow => follow.user.toString() === userid.toString());
                res.status(200).json({ isFollowing: isFollowing });
        });
    });
});

app.post('/followuser', (req, res) => {
    const loguser = req.body.loguser;
    const userid = req.body.userid;
    const s = req.body.sstatus;
    
    User.findById(loguser)
        .then(logguser => {
            if (!logguser) {
                return res.render('error', {
                    title: 'The Collectors Club | Error',
                    error: 'User not found'
                });
            }
            User.findById(userid)
                .then(u => {
                    if (!u) {
                        return res.render('error', {
                            title: 'The Collectors Club | Error',
                            error: 'User to follow not found'
                        });
                    }
                    
                    if (s === "follow") {
                        logguser.following.push({ user: userid });
                        u.followers.push({ user: loguser });
                    }
                    else if(s === "unfollow"){
                        logguser.following.pull({ user: userid });
                        u.followers.pull({ user: loguser });
                    }
                    Promise.all([logguser.save(), u.save()])
                            .then(() => {
                                res.status(200).json({ message: 'User followed successfully' });
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500).json({ message: 'Error saving user' });
                            });
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ message: 'Error finding user to follow' });
                });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error finding user' });
        });
});

app.post('/search', (req, res) => {
    const searchTerm = req.body.search;
    const loguser = req.query.loguser;
    const regex = new RegExp(searchTerm, "i");

    User.findOne({ username: loguser })
        .then(user => {
            if (!user) {
                res.status(404).json({ message: "User not found" });
            } else {
                if (searchTerm.includes("#")) {
                    Post.find({ tag: regex, reported: false })
                        .populate('user')
                        .populate('comments.user')
                        .sort({ dateposted: -1 })
                        .then(posts => {
                            posts.forEach(post => {
                                post.comments.sort((a, b) => b.date - a.date);
                            });
                            res.render('viewfeed', {
                                title: 'The Collectors Club | View Feed',
                                posts: posts,
                                loguser: user
                            });
                        })
                        .catch(err => {
                            res.status(500).json({ message: "An error occurred" });
                        });
                } else {
                    Post.find({ caption: regex, reported: false })
                        .populate('user')
                        .populate('comments.user')
                        .sort({ dateposted: -1 })
                        .then(posts => {
                            posts.forEach(post => {
                                post.comments.sort((a, b) => b.date - a.date);
                            });
                            res.render('viewfeed', {
                                title: 'The Collectors Club | View Feed',
                                posts: posts,
                                loguser: user
                            });
                        })
                        .catch(err => {
                            res.status(500).json({ message: "An error occurred" });
                        });
                }
            }
        })
        .catch(err => {
            res.status(500).json({ message: "An error occurred" });
        });
});

app.post('/comment', (req, res) => {
    const postid = req.body.postId;
    const loguser = req.body.loguser;
    const comment = req.body.newCommentText;
    
    Promise.all([
        Post.findById(postid),
        User.findOne({ username: loguser })
    ])
    .then(([post, user]) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        post.comments.push({ user: user._id, comment: comment, date: global.formatDate(Date.now())});

        return post.save().then(() => user._id);;
    })
    .then((userId) => {
        res.status(200).json({ userId: userId });
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/reportv', (req, res) =>{
    const loguser = req.query.loguser;

    if (req.isAuthenticated()){
        User.findOne({username: loguser})
        .then((user) => {
            if (!user) {
                return res.render('error', {
                    title: 'The Collectors Club | Error',
                    error: 'User not found'
                });
            }
            u = user;
        
            Post.find({reported: true}).populate('user').populate('comments.user').sort({ dateposted: -1 })
            .then(posts => {
                posts.forEach(post => {
                    post.comments.sort((a, b) => b.date - a.date);
                });
                res.render('reportv', {
                    title: 'The Collectors Club | Reports',
                    posts: posts,
                    loguser: u
                });
            });
        });
    }
});

app.post('/modpost', (req, res) => {
    const loguser = req.body.loguser;
    const postID = req.body.post;
    const user = req.body.user;
    const status = req.body.status;
    
    Promise.all([
        Post.findById(postID),
        User.findOne({ username: loguser }),
        User.findOne({ username: user })
    ])
    .then(([post, loginuser, foundUser]) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (!loginuser) {
            return res.status(404).json({ error: 'Login user not found' });
        }
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (status === "delete") {
            Post.findByIdAndDelete(post._id)
                .then(() => {
                    res.status(200).json({ message: 'Post deleted' });
                })
                .catch(err => {
                    res.status(500).json({ error: 'Failed to delete post' });
                });
        }
        else if (status === "report") {
            Post.findByIdAndUpdate(post._id, { $set: { reported: true } }, { new: true })
            .then(updatedPost => {
                res.status(200).json({ message: 'Post reported', post: updatedPost });
            })
            .catch(err => {
                res.status(500).json({ error: 'Failed to report post' });
            });
        }
        else {
            res.status(400).json({ error: 'Invalid action' });
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    });
});

app.post('/editpost', (req, res) => {
    const postID = req.body.post;
    const text = req.body.editp;
    
    Post.findById(postID)
    .then((post) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        return Post.findByIdAndUpdate(post._id, { caption: text }, { new: true });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    });
});

app.get('/likecheck', (req, res) =>{
    const loguser = req.query.loguser;

    User.findOne({username: loguser})
        .populate('liked')
        .populate('disliked')
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({
                likedPosts: user.liked,
                dislikedPosts: user.disliked
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

app.post('/like', (req, res) =>{

    Post.findOne({_id: req.body.postid})
    .then((p) =>{
        p.likes = req.body.likes;
        p.dislikes = req.body.dislikes;
        User.findOne({username: req.body.loguser})
        .then((u) =>{
            if (req.body.status === "liked"){
                let dislikedIndex = u.disliked.findIndex(item => item.post.equals(req.body.postid));
                if (dislikedIndex !== -1) {
                    u.disliked.splice(dislikedIndex, 1);
                }
                u.liked.push({post: req.body.postid});
            }
            else if (req.body.status === "disliked"){
                let likedIndex = u.liked.findIndex(item => item.post.equals(req.body.postid));
                if (likedIndex !== -1) {
                    u.liked.splice(likedIndex, 1);
                }
                u.disliked.push({post: req.body.postid});
            }
            else if (req.body.status === "unliked") {
                let likedIndex = u.liked.findIndex(item => item.post.equals(req.body.postid));
                if (likedIndex !== -1) {
                    u.liked.splice(likedIndex, 1);
                }
                
            }
            else if (req.body.status === "undisliked"){
                let dislikedIndex = u.disliked.findIndex(item => item.post.equals(req.body.postid));
                if (dislikedIndex !== -1) {
                    u.disliked.splice(dislikedIndex, 1);
                }
            }
            u.save();
            p.save();
        });
    });
});

app.post('/upload', upload.single('image'), (req, res, next) => {
    User.findOne({ _id: req.query.loguser })
        .then((u) => {
            try {
                let photoPath = null; 
                if (req.file) {
                    photoPath = path.basename(req.file.path);
                }
        
                const newPost = new Post({
                    user: req.query.loguser,
                    tag: req.body.tag,
                    caption: req.body.caption,
                    likes: 0,
                    dislikes: 0,
                    photo: photoPath,
                    comments: [],
                    reported: false,
                    dateposted: global.formatDate(Date.now())
                });
        
                newPost.save();
                res.redirect(`/viewfeed?status=fyp&loguser=${u.username}`);
            } catch (error) {
                console.error('Error in uploading: ', error);
                res.status(500).send('Error in uploading');
            }
        })
        .catch((error) => {
            console.error('Error finding user: ', error);
            res.status(500).send('Error finding user');
        });
});


app.post('/delpost', (req, res) => {
    const postID = req.body.post;

    Post.findByIdAndDelete(postID)
        .then(() => {
            res.status(200).json({ message: 'Post deleted' });
        })
        .catch(err => {
            res.status(500).json({ error: 'Failed to delete post' });
        });
});

app.post('/unrepost', (req, res) => {
    const postID = req.body.post;

    Post.updateOne({ _id: postID }, { $set: { reported: false } })
    .then(() => {
        res.status(200).json({ message: 'Post unreported successfully' });
    })
    .catch(err => {
        res.status(500).json({ error: 'Failed to unreport post' });
    });
});

app.post('/delcom', (req, res) => {
    const postid = req.body.post;
    const user = req.body.user;
    const comment = req.body.comment;
    const time = req.body.time;

    Post.findById(postid)
        .populate('comments.user')
        .then((post) => {
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const index = post.comments.findIndex((c) => c.user._id.toString() === user.toString() && c.comment === comment && global.formatDate(c.date) == time);

            if (index === -1) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            post.comments.splice(index, 1);

            post.save()
                .then(() => {
                    res.status(200).json({ message: 'Comment deleted successfully' });
                })
                .catch((err) => {
                    res.status(500).json({ error: 'Failed to delete comment', details: err });
                });
        })
        .catch((err) => {
            res.status(500).json({ error: 'Failed to find post', details: err });
        });
});

app.post('/editcom', (req, res) => {
    const postid = req.body.post;
    const user = req.body.user;
    const oldtxt = req.body.oldc;
    const text = req.body.editc;
    const time = req.body.time;
    
    Post.findById(postid)
    .populate('comments.user')
    .then((post) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const commentIndex = post.comments.findIndex(comment => comment.user._id.toString() === user.toString() && comment.comment === oldtxt && global.formatDate(comment.date) == time);
            if (commentIndex === -1) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            post.comments[commentIndex].comment = text;
            
            post.save()
                .then(() => {
                    res.status(200).json({ message: 'Comment edited successfully' });
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: 'Something went wrong' });
                });
        })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    });
});

app.post('/changepfp', upload.single('image'), (req, res) =>{
    User.findOne({ _id: req.query.loguser })
    .then((u) =>{
        let photoPath = null; 
        if (req.file) {
            photoPath = path.basename(req.file.path);
        }
        u.pfp = photoPath;
        
        u.save().then(() => {
            res.redirect(`/profile?userid=${req.query.loguser}&loguser=${req.query.loguser}`);
        }).catch((err) => {
            res.status(500).json({ error: 'Failed to update profile picture' });
        });
    }).catch((err) => {
        res.status(500).json({ error: 'Failed to find user' });
    });
});

app.post('/modpostprof', (req, res) => {
    const loguser = req.body.loguser;
    const postID = req.body.post;
    const user = req.body.user;
    const status = req.body.status;
    
    Promise.all([
        Post.findById(postID),
        User.findById(loguser),
        User.findById(user)
    ])
    .then(([post, loginuser, foundUser]) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (!loginuser) {
            return res.status(404).json({ error: 'Login user not found' });
        }
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (status === "delete") {
            Post.findByIdAndDelete(post._id)
                .then(() => {
                    res.status(200).json({ message: 'Post deleted' });
                })
                .catch(err => {
                    res.status(500).json({ error: 'Failed to delete post' });
                });
        }
        else if (status === "report") {
            Post.findByIdAndUpdate(post._id, { $set: { reported: true } }, { new: true })
            .then(updatedPost => {
                res.status(200).json({ message: 'Post reported', post: updatedPost });
            })
            .catch(err => {
                res.status(500).json({ error: 'Failed to report post' });
            });
        }
        else {
            res.status(400).json({ error: 'Invalid action' });
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    });
});

app.post('/editpost', (req, res) => {
    const postID = req.body.post;
    const text = req.body.editp;
    
    Post.findById(postID)
    .then((post) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        return Post.findByIdAndUpdate(post._id, { caption: text }, { new: true });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    });
});

app.get('/likecheckprof', (req, res) =>{
    const loguser = req.query.loguser;

    User.findById(loguser)
        .populate('liked')
        .populate('disliked')
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({
                likedPosts: user.liked,
                dislikedPosts: user.disliked
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

app.post('/likeprof', (req, res) =>{

    Post.findOne({_id: req.body.postid})
    .then((p) =>{
        p.likes = req.body.likes;
        p.dislikes = req.body.dislikes;
        User.findById(req.body.loguser)
        .then((u) =>{
            if (req.body.status === "liked"){
                let dislikedIndex = u.disliked.findIndex(item => item.post.equals(req.body.postid));
                if (dislikedIndex !== -1) {
                    u.disliked.splice(dislikedIndex, 1);
                }
                u.liked.push({post: req.body.postid});
            }
            else if (req.body.status === "disliked"){
                let likedIndex = u.liked.findIndex(item => item.post.equals(req.body.postid));
                if (likedIndex !== -1) {
                    u.liked.splice(likedIndex, 1);
                }
                u.disliked.push({post: req.body.postid});
            }
            else if (req.body.status === "unliked") {
                let likedIndex = u.liked.findIndex(item => item.post.equals(req.body.postid));
                if (likedIndex !== -1) {
                    u.liked.splice(likedIndex, 1);
                }
                
            }
            else if (req.body.status === "undisliked"){
                let dislikedIndex = u.disliked.findIndex(item => item.post.equals(req.body.postid));
                if (dislikedIndex !== -1) {
                    u.disliked.splice(dislikedIndex, 1);
                }
            }
            u.save();
            p.save();
        });
    });
});

app.post('/commentprof', (req, res) => {
    const postid = req.body.postId;
    const loguser = req.body.loguser;
    const comment = req.body.newCommentText;
    
    Promise.all([
        Post.findById(postid),
        User.findById(loguser)
    ])
    .then(([post, user]) => {
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        post.comments.push({ user: user._id, comment: comment, date: global.formatDate(Date.now())});

        return post.save().then(() => ({ userId: user._id, username: user.username }));
    })
    .then(({ userId, username }) => {
        res.status(200).json({ userId: userId, username: username });
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});
