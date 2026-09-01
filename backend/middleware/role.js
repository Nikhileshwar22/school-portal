const authorize = (
    ...allowedRoles
) => {

    return (
        req,
        res,
        next
    ) => {

        // ==============================================
        // USER MUST BE AUTHENTICATED
        // ==============================================

        if (!req.user) {

            return res.status(401).json({

                message:
                    "Authentication required"
            });
        }


        // ==============================================
        // CHECK ROLE
        // ==============================================

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {

            return res.status(403).json({

                message:
                    "Access denied. Insufficient permissions."
            });
        }


        next();
    };
};


module.exports = authorize;