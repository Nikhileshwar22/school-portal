import React from "react";

import {
    Navigate
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext";


const ProtectedRoute = ({
    children,
    allowedRoles
}) => {

    const {
        user,
        loading
    } = useAuth();


    // Still checking authentication
    if (loading) {

        return (
            <div
                style={{
                    textAlign: "center",
                    marginTop: "100px"
                }}
            >
                Loading...
            </div>
        );
    }


    // Not authenticated
    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    // Wrong role
    if (
        allowedRoles &&
        !allowedRoles.includes(
            user.role
        )
    ) {

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    return children;
};


export default ProtectedRoute;