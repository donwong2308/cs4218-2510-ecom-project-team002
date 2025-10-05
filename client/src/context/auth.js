import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    //default axios
    axios.defaults.headers.common["Authorization"] = auth?.token;

    useEffect(() => {
        try {
            const data = localStorage.getItem("auth");
            if (data) {
                const parseData = JSON.parse(data);
                setAuth({
                    ...auth,
                    user: parseData.user,
                    token: parseData.token,
                });
            }
        } catch (error) {
            console.error("Failed to parse auth data from localStorage:", error);
            // Bug Fix: Enhanced error handling based on unit test findings
            // Unit tests revealed need for graceful handling of corrupted localStorage data
            // Clear corrupted data to prevent future errors and application crashes
            localStorage.removeItem("auth");
        }
        //eslint-disable-next-line
    }, []);
    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export {useAuth, AuthProvider};