import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../services/authConfig";

export const useAuth = () => {
    const { instance } = useMsal();

    const activeAccount = instance.getActiveAccount();

    const login = () => {
        instance.loginRedirect(loginRequest); // ✅ usamos redirect (NO popup)
    };

    const logout = () => {
        instance.logoutRedirect();
    };

    return {
        activeAccount,
        isAuthenticated: !!activeAccount,
        login,
        logout,
    };
};