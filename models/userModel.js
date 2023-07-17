import mongoose from "mongoose";
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Post",
        },
    ],
    likedPosts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Post",
        },
    ],
    dislikedPosts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Post",
        },
    ],
    likedComments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    dislikedComments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
});
export default mongoose.model("User", userSchema);
//# sourceMappingURL=userModel.js.map