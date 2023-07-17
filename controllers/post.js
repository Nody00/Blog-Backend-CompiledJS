import postModel from "../models/postModel.js";
import userModel from "../models/userModel.js";
import commentModel from "../models/commentModel.js";
import { validationResult } from "express-validator";
import { ioObject } from "../index.js";
// interface IPost {
//   _id: Schema.Types.ObjectId;
//   title: string;
//   content: string;
//   likes: number;
//   dislikes: number;
//   favourites: number;
//   author: Schema.Types.ObjectId;
//   images: string[];
//   comments: Schema.Types.ObjectId[];
// }
export const getAllPosts = (req, res, next) => {
    postModel
        .find()
        .then((result) => {
        if (!result) {
            const error = {
                statusCode: 404,
                message: "Could not fetch posts",
            };
            throw error;
        }
        res
            .status(200)
            .json({ message: "Posts fetched", posts: result.reverse() });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const searchPosts = (req, res, next) => {
    const filter = req.body.filter;
    postModel
        .find({ content: { $regex: filter } })
        .then((results) => {
        res.json({ result: results });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const getPost = (req, res, next) => {
    const postId = req.params.postId;
    postModel
        .findById(postId)
        .populate("comments")
        .then((result) => {
        if (!result) {
            const error = {
                statusCode: 404,
                message: "Could not fetch post",
            };
            throw error;
        }
        res.status(200).json({ message: "Post fetched", post: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const getUserPosts = (req, res, next) => {
    const userId = req.params.userId;
    postModel
        .find({ author: userId })
        .then((result) => {
        if (!result) {
            const error = {
                statusCode: 404,
                message: "Could not fetch posts",
            };
            throw error;
        }
        res.status(200).json({ message: "Posts fetched", posts: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const addNewPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(422)
            .json({ message: "Validation failed", errors: errors.array() });
    }
    const title = req.body.title;
    const content = req.body.content;
    const images = req.body.images;
    const userId = req.body.userId;
    let authorEmail;
    const user = await userModel.findById(userId);
    if (!user) {
        const error = {
            message: "User does not exist",
            statusCode: 406,
        };
        throw error;
    }
    authorEmail = user.email;
    const newPost = new postModel({
        title: title,
        content: content,
        images: images,
        author: userId,
        likes: 0,
        dislikes: 0,
        favourites: 0,
        authorEmail: authorEmail,
        dislikedBy: new Map(),
        likedBy: new Map(),
    });
    let savedPost;
    newPost
        .save()
        .then((result) => {
        savedPost = result;
        return userModel.findById(userId);
    })
        .then((user) => {
        if (!user) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        user.posts.unshift(savedPost._id);
        return user.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            newPost: savedPost,
            action: "new",
        });
        res.status(200).json({ result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const deletePost = (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.body.userId;
    postModel
        .findOneAndDelete({ author: userId, _id: postId })
        .then((result) => {
        return userModel.findById(userId);
    })
        .then((user) => {
        if (!user) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        const existingItemIndex = user.posts.findIndex((e) => e._id.toString() === postId);
        if (existingItemIndex === -1) {
            const error = {
                message: "No such post is associated with this user",
                statusCode: 404,
            };
            throw error;
        }
        user.posts.splice(existingItemIndex, 1);
        return user.save();
    })
        .then((result) => {
        return commentModel.find({ post: postId });
    })
        .then((comments) => {
        if (!comments) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        comments.forEach((comment) => comment.deleteOne());
        ioObject.emit("posts", {
            deletedId: postId,
            action: "delete",
        });
        res.status(200).json({ message: "Post deleted successfully" });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const editPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(422)
            .json({ message: "Validation failed", errors: errors.array() });
    }
    const postId = req.params.postId;
    const userId = req.body.userId;
    const title = req.body.title;
    const content = req.body.content;
    const images = req.body.images;
    postModel
        .findOne({ _id: postId, author: userId })
        .then((post) => {
        if (!post) {
            const error = {
                message: "No such post",
                statusCode: 404,
            };
            throw error;
        }
        // edit post
        post.title = title;
        post.content = content;
        post.images = images;
        return post.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            editedPost: result,
            action: "edit",
        });
        res.status(200).json({ message: "Post edited!", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const addComment = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(422)
            .json({ message: "Validation failed", errors: errors.array() });
    }
    const postId = req.params.postId;
    const userId = req.body.userId;
    const email = req.body.email;
    const content = req.body.content;
    // add new comment
    const newComment = new commentModel({
        author: email,
        post: postId,
        content: content,
        likes: 0,
        dislikes: 0,
    });
    newComment
        .save()
        .then((result) => {
        return postModel.findOne({ _id: postId, author: userId });
    })
        .then((post) => {
        if (!post) {
            const error = {
                message: "No such post",
                statusCode: 404,
            };
            throw error;
        }
        post.comments.push(newComment._id);
        return post.save();
    })
        .then((savedPost) => {
        return savedPost.populate("comments");
    })
        .then((result) => {
        ioObject.emit("posts", {
            postWithNewComment: result,
            action: "newComment",
        });
        res.status(200).json({ message: "Comment added", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const deleteComment = (req, res, next) => {
    const commentId = req.params.commentId;
    const email = req.body.email;
    commentModel
        .findOne({ _id: commentId, author: email })
        .then((comment) => {
        if (!comment) {
            const error = {
                statusCode: 404,
                message: "Could not fetch post",
            };
            throw error;
        }
        return comment.deleteOne();
    })
        .then((result) => {
        ioObject.emit("posts", {
            commentIdDelete: commentId,
            action: "deleteComment",
        });
        res.status(200).json({ message: "Comment deleted", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const editComment = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(422)
            .json({ message: "Validation failed", errors: errors.array() });
    }
    const commentId = req.params.commentId;
    const email = req.body.email;
    const newContent = req.body.content;
    commentModel
        .findOne({ _id: commentId, author: email })
        .then((comment) => {
        if (!comment) {
            const error = {
                statusCode: 404,
                message: "Could not fetch post",
            };
            throw error;
        }
        comment.content = newContent;
        return comment.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            commentLiked: result,
            action: "likeComment",
        });
        res.status(200).json({ message: "Comment updated" });
    })
        .catch((err) => {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const likePost = (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.body.userId;
    let loadedPost;
    postModel
        .findOne({ _id: postId })
        .then((post) => {
        if (!post) {
            const error = {
                message: "No such post",
                statusCode: 404,
            };
            throw error;
        }
        loadedPost = post;
        return userModel.findOne({ _id: userId });
    })
        .then((user) => {
        if (!user) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        const existingDislikedUser = loadedPost.dislikedBy.get(userId);
        const existingLikedUser = loadedPost.likedBy.get(userId);
        // post already disliked
        const existingDislikedPostIndex = user.dislikedPosts.findIndex((e) => e.toString() === loadedPost._id.toString());
        // post already liked
        const existinglikedPostIndex = user.likedPosts.findIndex((e) => e.toString() === loadedPost._id.toString());
        if (existingDislikedPostIndex !== -1 && existingDislikedUser === "") {
            user.dislikedPosts.splice(existingDislikedPostIndex, 1);
            loadedPost.dislikedBy.delete(userId);
            loadedPost.dislikes =
                loadedPost.dislikes === 0 ? 0 : loadedPost.dislikes - 1;
        }
        if (existinglikedPostIndex !== -1 && existingLikedUser === "") {
            user.likedPosts.splice(existinglikedPostIndex, 1);
            loadedPost.likedBy.delete(userId);
            loadedPost.likes = loadedPost.likes === 0 ? 0 : loadedPost.likes - 1;
            return user.save();
        }
        user.likedPosts.push(loadedPost._id);
        loadedPost.likes = loadedPost.likes + 1;
        loadedPost.likedBy.set(userId, "");
        return user.save();
    })
        .then((userSaved) => {
        return loadedPost.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            id: result._id.toString(),
            action: "liked",
        });
        res.status(200).json({ message: "Post liked", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const dislikePost = (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.body.userId;
    let loadedPost;
    postModel
        .findOne({ _id: postId })
        .then((post) => {
        if (!post) {
            const error = {
                message: "No such post",
                statusCode: 404,
            };
            throw error;
        }
        loadedPost = post;
        return post.save();
    })
        .then((result) => {
        return userModel.findOne({ _id: userId });
    })
        .then((user) => {
        if (!user) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        const existingDislikedUser = loadedPost.dislikedBy.get(userId);
        const existingLikedUser = loadedPost.likedBy.get(userId);
        // post already disliked
        const existingDislikedPostIndex = user.dislikedPosts.findIndex((e) => e.toString() === loadedPost._id.toString());
        // post already liked
        const existinglikedPostIndex = user.likedPosts.findIndex((e) => e.toString() === loadedPost._id.toString());
        if (existingDislikedPostIndex !== -1 || existingDislikedUser === "") {
            user.dislikedPosts.splice(existingDislikedPostIndex, 1);
            loadedPost.dislikedBy.delete(userId);
            loadedPost.dislikes =
                loadedPost.dislikes === 0 ? 0 : loadedPost.dislikes - 1;
            return user.save();
        }
        if (existinglikedPostIndex !== -1 || existingLikedUser === "") {
            user.likedPosts.splice(existinglikedPostIndex, 1);
            loadedPost.likedBy.delete(userId);
            loadedPost.likes = loadedPost.likes === 0 ? 0 : loadedPost.likes - 1;
        }
        user.dislikedPosts.push(loadedPost._id);
        loadedPost.dislikedBy.set(userId, "");
        loadedPost.dislikes = loadedPost.dislikes + 1;
        return user.save();
    })
        .then((result) => {
        return loadedPost.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            id: result._id.toString(),
            action: "disliked",
        });
        res.status(200).json({ message: "Post disliked", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const likeComment = (req, res, next) => {
    const commentId = req.params.commentId;
    const userId = req.body.userId;
    let loadedComment;
    commentModel
        .findOne({ _id: commentId })
        .then((comment) => {
        if (!comment) {
            const error = {
                message: "No such comment",
                statusCode: 404,
            };
            throw error;
        }
        loadedComment = comment;
        return comment.save();
    })
        .then((result) => {
        return userModel.findOne({ _id: userId });
    })
        .then((user) => {
        if (!user) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        // comment already disliked
        const existingDislikedCommentIndex = user.dislikedComments.findIndex((e) => e.toString() === loadedComment._id.toString());
        // post already liked
        const existinglikedCommentIndex = user.likedComments.findIndex((e) => e.toString() === loadedComment._id.toString());
        if (existingDislikedCommentIndex !== -1) {
            user.dislikedComments.splice(existingDislikedCommentIndex, 1);
            loadedComment.dislikes =
                loadedComment.dislikes === 0 ? 0 : loadedComment.dislikes - 1;
        }
        if (existinglikedCommentIndex !== -1) {
            user.likedComments.splice(existinglikedCommentIndex, 1);
            loadedComment.likes =
                loadedComment.likes === 0 ? 0 : loadedComment.likes - 1;
            return user.save();
        }
        user.likedComments.push(loadedComment._id);
        loadedComment.likes = loadedComment.likes + 1;
        return user.save();
    })
        .then((userSaved) => {
        return loadedComment.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            commentLiked: loadedComment,
            action: "likeComment",
        });
        res.status(200).json({ message: "Comment liked", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const dislikeComment = (req, res, next) => {
    const commentId = req.params.commentId;
    const userId = req.body.userId;
    let loadedComment;
    commentModel
        .findOne({ _id: commentId })
        .then((comment) => {
        if (!comment) {
            const error = {
                message: "No such comment",
                statusCode: 404,
            };
            throw error;
        }
        loadedComment = comment;
        return comment.save();
    })
        .then((result) => {
        return userModel.findOne({ _id: userId });
    })
        .then((user) => {
        if (!user) {
            const error = {
                message: "User does not exist",
                statusCode: 406,
            };
            throw error;
        }
        // post already disliked
        const existingDislikedCommentIndex = user.dislikedComments.findIndex((e) => e.toString() === loadedComment._id.toString());
        // post already liked
        const existinglikedCommentIndex = user.likedComments.findIndex((e) => e.toString() === loadedComment._id.toString());
        if (existingDislikedCommentIndex !== -1) {
            user.dislikedComments.splice(existingDislikedCommentIndex, 1);
            loadedComment.dislikes =
                loadedComment.dislikes === 0 ? 0 : loadedComment.dislikes - 1;
            return user.save();
        }
        if (existinglikedCommentIndex !== -1) {
            user.likedComments.splice(existinglikedCommentIndex, 1);
            loadedComment.likes =
                loadedComment.likes === 0 ? 0 : loadedComment.likes - 1;
        }
        user.dislikedComments.push(loadedComment._id);
        loadedComment.dislikes = loadedComment.dislikes + 1;
        return user.save();
    })
        .then((result) => {
        return loadedComment.save();
    })
        .then((result) => {
        ioObject.emit("posts", {
            commentLiked: loadedComment,
            action: "likeComment",
        });
        res.status(200).json({ message: "Post disliked", result: result });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const getUserData = async (req, res, next) => {
    const userId = req.params.userId;
    console.log(userId);
    userModel
        .findById(userId)
        .populate("posts likedComments dislikedComments likedPosts dislikedPosts")
        .then((userData) => {
        res.status(200).json(userData);
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
//# sourceMappingURL=post.js.map