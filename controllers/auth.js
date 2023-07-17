import { validationResult } from "express-validator/src/validation-result.js";
import userModel from "../models/userModel.js";
import commentModel from "../models/commentModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import postModel from "../models/postModel.js";
export const login = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(422)
            .json({ message: "Validation failed", errors: errors.array() });
    }
    // reach out to db find the user check the passwords and return token
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    userModel
        .findOne({ email: email })
        .then((user) => {
        if (!user) {
            const error = {
                message: "No such user found",
                statusCode: 404,
            };
            throw error;
        }
        // user exists compare passwords
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
        .then((isEqual) => {
        if (!isEqual) {
            const error = {
                message: "Passwords do not match",
                statusCode: 406,
            };
            throw error;
        }
        // passwords match create token and send it to the user
        const token = jwt.sign({
            email: loadedUser.email,
            userId: loadedUser._id.toString(),
        }, process.env.SECRET_KEY || "supersecretkey", {
            expiresIn: "3h",
        });
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 3);
        res.status(200).json({
            token: token,
            userId: loadedUser._id.toString(),
            email: loadedUser.email,
            expirationDate: expirationDate,
        });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(422)
            .json({ message: "Validation failed", errors: errors.array() });
    }
    const email = req.body.email;
    const password = req.body.password;
    // see if user already exists
    userModel
        .findOne({ email: email })
        .then((user) => {
        if (user) {
            const error = {
                message: "User already exists",
                statusCode: 406,
            };
            throw error;
        }
        return bcrypt.hash(password, 12);
    })
        .then((hashedPass) => {
        const newUser = new userModel({
            email: email,
            password: hashedPass,
        });
        return newUser.save();
    })
        .then((result) => {
        res.status(200).json({ message: "User created!" });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const deleteProfile = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "Validation failed",
            errors: errors.array(),
            error: true,
            errorMessage: "Password invalid",
        });
    }
    const userId = req.params.userId;
    const password = req.body.password;
    // delete profile
    // delete comments
    // delete posts
    let loadedUser;
    let loadedComments;
    let loadedPosts;
    userModel
        .findById(userId)
        .then((user) => {
        if (!user) {
            const error = {
                message: "No such user exists",
                statusCode: 404,
            };
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
        .then((isEqual) => {
        if (!isEqual) {
            const error = {
                message: "Wrong password",
                statusCode: 403,
            };
            throw error;
        }
        return commentModel.find({ author: loadedUser.email });
    })
        .then((comments) => {
        loadedComments = comments;
        return postModel.find({ author: userId });
    })
        .then((posts) => {
        loadedPosts = posts;
        return loadedUser.deleteOne();
    })
        .then((result) => {
        loadedComments.forEach((comment) => comment.deleteOne());
        loadedPosts.forEach((post) => post.deleteOne());
        res.status(200).json({ result: "Profile data deleted" });
    })
        .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
export const changeEmail = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: "Validation failed",
                errors: errors.array(),
                error: true,
                errorMessage: "Email or password invalid",
            });
        }
        const userId = req.params.userId;
        const newEmail = req.body.email;
        const password = req.body.password;
        console.log(userId, newEmail, password);
        const user = await userModel.findById(userId);
        if (!user) {
            const error = {
                message: "No such user exists",
                statusCode: 404,
            };
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = {
                message: "Wrong password",
                statusCode: 403,
            };
            throw error;
        }
        if (user.email === newEmail) {
            const error = {
                message: "Same Email",
                statusCode: 400,
            };
            throw error;
        }
        user.email = newEmail;
        const result = await user.save();
        res.status(200).json({ message: "Email changed", result: result });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const changePassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: "Validation failed",
                errors: errors.array(),
                error: true,
                errorMessage: "Password may be invalid",
            });
        }
        const userId = req.params.userId;
        const newPassword = req.body.newPassword;
        const password = req.body.password;
        const user = await userModel.findById(userId);
        if (!user) {
            const error = {
                message: "No such user exists",
                statusCode: 404,
            };
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = {
                message: "Wrong password",
                statusCode: 403,
            };
            throw error;
        }
        const newHashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = newHashedPassword;
        const result = await user.save();
        res.status(200).json({ message: "Password changed", result: result });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
//# sourceMappingURL=auth.js.map