import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await API.get("/auth/me");
            setUser(response.data.user);
            return response.data.user;
        } catch (error) {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await API.post("/auth/login", { email, password });
        if (response.data.user) {
            setUser(response.data.user);
        }
        return response.data;
    };

    const logout = async () => {
        try {
            await API.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                login,
                logout,
                checkAuth,
                loadUser: checkAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);