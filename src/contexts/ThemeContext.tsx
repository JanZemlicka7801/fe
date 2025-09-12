import React, {createContext, useContext, useEffect, useMemo, useState} from "react";
import { fetchUserSettings, updateUserSettings } from "../services/settingsService";
import { useAuth } from "./AuthContext";

export type Theme = "light" | "dark" | "system";

type Ctx = {
    theme: Theme;
    resolved: "light" | "dark";
    setTheme: (t: Theme) => void;
    loading: boolean;
};

const ThemeCtx = createContext<Ctx | null>(null);

// Fallback function to get theme from localStorage
function getStored(): Theme {
    const t = localStorage.getItem("theme");
    return (t === "light" || t === "dark" || t === "system") ? t : "system";
}

function osPrefersDark(): boolean {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const { token } = useAuth() || {};
    const [theme, setThemeState] = useState<Theme>(getStored);
    const [loading, setLoading] = useState(true);

    // Load theme from server on mount
    useEffect(() => {
        const loadTheme = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const settings = await fetchUserSettings(token);
                setThemeState(settings.appearance.theme);
            } catch (error) {
                console.error('Failed to load theme from server, using localStorage fallback', error);
                // Fallback to localStorage
                setThemeState(getStored());
            } finally {
                setLoading(false);
            }
        };

        loadTheme();
    }, [token]);

    // Set theme function that saves to server and localStorage
    const setTheme = async (newTheme: Theme) => {
        // Update state immediately for responsive UI
        setThemeState(newTheme);
        
        // Save to localStorage as fallback
        localStorage.setItem("theme", newTheme);
        
        // Save to server if token is available
        if (token) {
            try {
                await updateUserSettings(token, {
                    appearance: { theme: newTheme }
                });
            } catch (error) {
                console.error('Failed to save theme to server, using localStorage fallback', error);
            }
        }
    };

    const resolved = useMemo<"light" | "dark">(
        () => theme === "system" ? (osPrefersDark() ? "dark" : "light") : theme,
        [theme]
    );

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", resolved);
    }, [resolved]);

    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => document.documentElement.setAttribute("data-theme", mq.matches ? "dark" : "light");
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, [theme]);

    const value: Ctx = { theme, resolved, setTheme, loading };
    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export function useTheme(): Ctx {
    const v = useContext(ThemeCtx);
    if (!v) throw new Error("useTheme must be used within ThemeProvider");
    return v;
}