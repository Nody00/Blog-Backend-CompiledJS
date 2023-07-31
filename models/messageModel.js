import mongoose from "mongoose";
const Schema = mongoose.Schema;
const messageSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdDate: {
        type: Date,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    images: [
        {
            type: String,
        },
    ],
});
export default mongoose.model("Message", messageSchema);
//# sourceMappingURL=messageModel.js.map