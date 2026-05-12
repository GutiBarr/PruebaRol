// useAuth.ts
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

export const useAuth = () => {
    const { instance, accounts, inProgress } = useMsal();

    const activeAccount = instance.getActiveAccount() || accounts[0];
    const isAuthorized = activeAccount?.username.toLowerCase().endsWith('@stemdo.io');

    // Estado de carga robusto
    const isLoading = inProgress !== InteractionStatus.None;

    // Solo es auténtico si no está cargando Y tiene cuenta Y el dominio es correcto
    const isAuthenticated = !isLoading && !!activeAccount && isAuthorized;

    return {
        isLoading,
        isAuthenticated,
        activeAccount,
        isAuthorized,
        login: () => instance.loginRedirect(),
        logout: () => instance.logoutRedirect(),
    };
};