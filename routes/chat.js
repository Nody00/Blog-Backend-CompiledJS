import express from "express";
import { body } from "express-validator";
import { isAuth } from "../helpers/isAuth.js";
import { createNewChat, deleteChat, addNewMessage, deleteMessage, getChat, getAllChats, getAllUsers, } from "../controllers/chat.js";
const router = express.Router();
// route for creating a chat
router.post("/newChat", isAuth, [
    body("userEmail1").notEmpty().escape().trim().isEmail(),
    body("userEmail2").notEmpty().escape().trim().isEmail(),
], createNewChat);
// route for deleting a chat
router.post("/deleteChat/:chatId", isAuth, deleteChat);
// route for adding a message
router.post("/newMessage", isAuth, [
    body("userId").notEmpty().escape().trim(),
    body("message").notEmpty().escape().trim().isLength({ max: 200 }),
    body("chatId").notEmpty().escape().trim(),
], addNewMessage);
// route for deleting a message
router.post("/deleteMessage", isAuth, [
    body("messageId").notEmpty().escape().trim(),
    body("chatId").notEmpty().escape().trim(),
], deleteMessage);
// route for getting a chat
router.post("/getChat/:chatId", isAuth, getChat);
// route for getting all chats
router.post("/getAllChats", isAuth, [body("userId").notEmpty().escape().trim()], getAllChats);
// route for getting all users
router.post("/usersAll", isAuth, getAllUsers);
export default router;
//# sourceMappingURL=chat.js.map