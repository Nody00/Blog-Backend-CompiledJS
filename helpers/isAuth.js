import jwt from "jsonwebtoken";
export const isAuth = (req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        const error = {
            statusCode: 401,
            message: "Not auth header found!",
        };
        throw error;
    }
    const token = req.get("Authorization").split(" ")[1];
    if (!token) {
        const error = {
            statusCode: 401,
            message: "Not token found!",
        };
        throw error;
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY || "supersecretkey");
    }
    catch (err) {
        throw err;
    }
    if (!decodedToken) {
        const error = {
            statusCode: 401,
            message: "Not authenticated!",
        };
        throw error;
    }
    next();
};
//# sourceMappingURL=isAuth.js.map