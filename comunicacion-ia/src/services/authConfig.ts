import { type Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "http://localhost:5173", // ⚠️ cambia si usas otro puerto
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        // console.info(message); // Silenciado para no llenar la consola
                        return;
                    case LogLevel.Verbose:
                        // console.debug(message); // Silenciado para no llenar la consola
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
        },
    },
};

export const loginRequest = {
    scopes: ["User.Read"],
};