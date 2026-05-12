import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../services/authConfig";

export const useAuth = () => {
    const { instance, accounts } = useMsal();

    // Priorizar cuenta activa, pero usar la primera disponible como fallback
    const activeAccount = instance.getActiveAccount() || accounts[0];
    const isAuthorized = activeAccount?.username.toLowerCase().endsWith('@stemdo.io');

    const login = () => {
        instance.loginRedirect(loginRequest);
    };

    const logout = () => {
        instance.logoutRedirect();
    };

    return {
        instance,
        accounts,
        activeAccount,
        isAuthenticated: !!activeAccount && isAuthorized,
        isAuthorized,
        login,
        logout,
    };
};
