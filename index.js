import express from "express";
import authRouter from "./routes/auth.js";
import postRouter from "./routes/post.js";
import chatRouter from "./routes/chat.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import socket from "./socket.js";
export let ioObject;
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,PATCH,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    next();
});
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/chat", chatRouter);
app.use((err, req, res, next) => {
    res.status(500).json({ error: true, errorObject: err });
});
mongoose
    .connect(`mongodb+srv://${process.env.MONGO_USERNAME || "dinokrcic2077"}:${process.env.MONGO_PASSWORD || "cSzJILiPQ8usDHAc"}@cluster0.c6rbyhf.mongodb.net/?retryWrites=true&w=majority`)
    .then((result) => {
    const server = app.listen(process.env.PORT || 8080);
    const io = socket.init(server);
    ioObject = io;
    // io.on("connection", (socket: any) => {
    //   console.log("new user");
    // });
})
    .catch((err) => {
    console.log(err);
});
//# sourceMappingURL=index.js.map