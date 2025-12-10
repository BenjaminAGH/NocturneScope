"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "es" | "en";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
    es: {
        footerDescription: "NocturneScope es la tesis para el título de Ingeniero de Ejecución en Computación e Informática que busca formalizar una plataforma para la gestión de redes.",
        socialNetworks: "Redes Sociales",
        madeBy: "Hecho por",
        copyright: "Copyright ©",
        logoAltLight: "Logo claro",
        logoAltDark: "Logo oscuro",
    },
    en: {
        footerDescription: "NocturneScope is the thesis for the Computer Execution Engineer degree seeking to formalize a platform for network management.",
        socialNetworks: "Social Networks",
        madeBy: "Made by",
        copyright: "Copyright ©",
        logoAltLight: "Light Logo",
        logoAltDark: "Dark Logo",
    },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("es");

    useEffect(() => {
        const savedLanguage = localStorage.getItem("language") as Language;
        if (savedLanguage) {
            setLanguage(savedLanguage);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("language", lang);
    };

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
