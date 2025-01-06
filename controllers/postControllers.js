const Post = require('../models/postModel')
const User = require('../models/userModel')
const path = require('path')
const fs = require('fs')
const {v4: uuid} = require('uuid')
const HttpError = require('../models/errorModel')



// CREATE A POST
// POST: api/posts
// PROTECTED
const createPost = async (req, res, next) => {
    try {
        let {title, category, description, story} = req.body;
        if(!title || !category || !description || !story || !req.files) {
            return next(new HttpError("Fill all fields and Select an Image", 422))
        }
        const {avatar} = req.files;
        // check file size
        if(avatar.size > 5000000) {
            return next(new HttpError("Image size should not exceed 5MB", 422))
        }
        let fileName = avatar.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1]
        avatar.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if(err) {
                return next(new HttpError(err));
            } else {
                const newPost = await Post.create({title, category, description, story, avatar: newFilename, creator: req.user.id })
                if(!newPost) {
                    return next(new HttpError("Post could not be created", 422))
                }
                // Find user and increase post count by one
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})

                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}



// GET ALL POSTS
// GET: api/posts
// UNPROTECTED
const getPosts = async (req, res, next) => {
    try{
        const posts = await Post.find().sort({updatedAt: -1})
        res.status(200).json(posts)
    }catch (error) {
        return next(new HttpError(error))
    }
}



// GET SINGLE POST
// GET: api/posts/:id
// UNPROTECTED
const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post) {
            return next(new HttpError("Post not found", 404))
        }
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError(error))
    }
}



// GET POSTS BY CATEGORY
// GET: api/posts/categories/:category
// PROTECTED
const getCatPosts = async (req, res, next) => {
    try {
        const {category} = req.params;
        const catPosts = await Post.find({category}).sort({createdAt: -1})
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error))
    }
}



// GET USER POSTS
// GET: api/posts/users/:id
// UNPROTECTED
const getUserPosts = async (req, res, next) => {
    try {
        const {id} = req.params;
        const posts = await Post.find({creator: id}).sort({createdAt: -1})
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}


// EDIT POST
// PATCH: api/posts/:id
// PROTECTED
const editPost = async (req, res, next) => {
    try {
        let fileName;
        let newFilename;
        let updatedPost;
        const postId = req.params.id;
        let {title, category, description, story} = req.body;

        if(!title || !category || !description || !story) {
            return next(new HttpError("Fill all fields", 422))
        }
            // get old post from database
            const oldPost = await Post.findById(postId);
            if(req.user.id == oldPost.creator) {
                if(!req.files) {
                    updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description, story}, {new: true})
                } else {
                     // delete old avatar from upload
                fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.avatar), async (err) => {
                    if(err) {
                        return next(new HttpError(err));
                        }
                    })
                // upload new avatar
                const {avatar} = req.files;
                // check file size
                if(avatar.size > 5000000) {
                    return next(new HttpError("Image size should not exceed 5MB"))
                }
                fileName = avatar.name;
                let splittedFilename = fileName.split('.')
                newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
                avatar.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
                    if(err) {
                        return next(new HttpError(err));
                    }
                })
                updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description, story, avatar: newFilename}, {new: true})
            }
        }
            if(!updatedPost) {
                return next(new HttpError("Post could not be updated", 400))
            }

            res.status(200).json(updatedPost)
    } catch (error) {
        return next(new HttpError(error))
    }
}


// DELETE POST
// DELETE: api/posts/:id
// PROTECTED
const deletePost = async (req, res, next) => {
    try {
        const postId = req.params.id
        if(!postId) {
            return next(new HttpError("Post Unavailable", 400))
        }
        const post = await Post.findById(postId);
        const fileName = post?.avatar;
        if(req.user.id == post.creator) {
        // delete avatar from upload folder
        fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
            if(err) {
                return next(new HttpError(err));
            } else {
                await Post.findByIdAndDelete(postId);
                // find user and reduce post count by 1
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser?.posts - 1;
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
                res.json(`Post ${postId} deleted successfully`)
            }
        })
    } else {
        return next(new HttpError("Post Coult not be deleted", 403))
    }
       
    } catch (error) {
        
    }
}


module.exports = {createPost, getPosts, getPost, getCatPosts, getUserPosts, editPost, deletePost}