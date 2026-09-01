const jwt = require("jsonwebtoken");


const authenticate = (
    req,
    res,
    next
) => {

    try {

        let token = null;


        // ==============================================
        // GET JWT FROM HTTPONLY COOKIE
        // ==============================================

        if (
            req.cookies &&
            req.cookies.access_token
        ) {

            token =
                req.cookies.access_token;
        }


        // ==============================================
        // OPTIONAL: GET JWT FROM AUTHORIZATION HEADER
        // ==============================================
        //
        // Useful for Postman testing.
        //

        if (!token) {

            const authHeader =
                req.headers.authorization;


            if (
                authHeader &&
                authHeader.startsWith("Bearer ")
            ) {

                token =
                    authHeader.split(" ")[1];
            }
        }


        // ==============================================
        // TOKEN NOT FOUND
        // ==============================================

        if (!token) {

            return res.status(401).json({

                message:
                    "Authentication required"
            });
        }


        // ==============================================
        // VERIFY JWT
        // ==============================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ==============================================
        // STORE USER INFORMATION
        // ==============================================

        req.user = decoded;


        next();

    } catch (error) {

        console.error(
            "JWT authentication error:",
            error.message
        );


        return res.status(401).json({

            message:
                "Invalid or expired token"
        });
    }
};


module.exports = authenticate;