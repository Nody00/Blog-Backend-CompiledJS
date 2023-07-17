import mongoose from "mongoose";
const Schema = mongoose.Schema;
const postSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    likes: {
        type: Number,
        required: true,
    },
    dislikes: {
        type: Number,
        required: true,
    },
    favourites: {
        type: Number,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    authorEmail: {
        type: String,
        required: true,
    },
    images: [
        {
            type: String,
        },
    ],
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    likedBy: {
        type: Map,
        required: true,
    },
    dislikedBy: {
        type: Map,
        required: true,
    },
});
export default mongoose.model("Post", postSchema);
//# sourceMappingURL=postModel.js.map