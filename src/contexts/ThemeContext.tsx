import React, {createContext, useContext, useEffect, useMemo, useState} from "react";

export type Theme = "light" | "dark" | "system";

type Ctx = {
    theme: Theme;
    resolved: "light" | "dark";
    setTheme: (t: Theme) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

function getStored(): Theme {
    const t = localStorage.getItem("theme");
    return (t === "light" || t === "dark" || t === "system") ? t : "system";
}

function osPrefersDark(): boolean {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const [theme, setTheme] = useState<Theme>(getStored);

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

    useEffect(() => {
        localStorage.setItem("theme", theme);
    }, [theme]);

    const value: Ctx = { theme, resolved, setTheme };
    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export function useTheme(): Ctx {
    const v = useContext(ThemeCtx);
    if (!v) throw new Error("useTheme must be used within ThemeProvider");
    return v;
}