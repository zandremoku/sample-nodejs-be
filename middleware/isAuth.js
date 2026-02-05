import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

const isAuth = (req, res, next) => {
    let authHeader;
    let sessionId = req?.cookies?.sessionId;
    console.log('sessionId', sessionId);
    if (!sessionId) {
        authHeader = req.headers.authorization;
        console.log('auth header', authHeader);
        const bearerPrefix = "Bearer ";
        if (authHeader?.startsWith(bearerPrefix)) {
            authHeader = authHeader.slice(bearerPrefix.length).trim();
        }
    } else {
        authHeader = sessionId;
    }
    if (!authHeader) {
        res.status(401).json({
            message: 'Unauthenticated'
        });
    }
    try{
        const decodedToken = jwt.verify(authHeader, process.env.JWT_KEY);

        req.userId = decodedToken?.userId;
        req.email = decodedToken?.email;
        next();
    }catch (e) {
        res.status(401).json({
            message: 'Unauthenticated'
        });
    }
}

export default isAuth;
