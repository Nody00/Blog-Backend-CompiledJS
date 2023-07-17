import express from "express";
import { login, signup, deleteProfile, changeEmail, changePassword, } from "../controllers/auth.js";
import { body } from "express-validator";
import { isAuth } from "../helpers/isAuth.js";
const router = express.Router();
router.post("/login", [
    body("email").trim().notEmpty().escape().isEmail(),
    body("password").trim().notEmpty().escape().isLength({ min: 7 }),
], login);
router.post("/signup", [
    body("email").trim().notEmpty().escape().isEmail(),
    body("password").trim().notEmpty().escape().isLength({ min: 7 }),
], signup);
router.post("/deleteProfile/:userId", body("password").trim().notEmpty().escape().isLength({ min: 7 }), isAuth, deleteProfile);
router.post("/changeEmail/:userId", [
    body("password").trim().notEmpty().escape().isLength({ min: 7 }),
    body("email").trim().notEmpty().escape().isEmail(),
], isAuth, changeEmail);
router.post("/changePassword/:userId", [
    body("password").trim().notEmpty().escape().isLength({ min: 7 }),
    body("newPassword").trim().notEmpty().escape().isLength({ min: 7 }),
], isAuth, changePassword);
export default router;
//# sourceMappingURL=auth.js.map