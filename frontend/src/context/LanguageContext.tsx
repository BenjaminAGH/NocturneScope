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
        // Navbar
        dashboard: "Dashboard",
        topology: "Topología",
        features: "Características",
        demo: "Demo",
        downloads: "Descarga",
        notifications: "Notificaciones",
        markAllRead: "Marcar todas como leídas",
        clearHistory: "Borrar historial",
        noNotifications: "No hay notificaciones",
        login: "Iniciar Sesión",
        goToDashboard: "Ir al Dashboard",
        myAccount: "Mi Cuenta",
        apiTokens: "Tokens API",
        adminAccount: "Administrar Cuenta",
        adminUsers: "Administrar Usuarios",
        logout: "Cerrar Sesión",
        changeGroup: "Cambiar Grupo",
        manageGroups: "Gestionar Grupos",
        // Dashboard
        device: "Dispositivo",
        metric: "Métrica",
        timeRange: "Rango de Tiempo",
        noDevices: "Sin dispositivos",
        status: "Estado",
        systemUnknown: "Sistema Desconocido",
        network: "Red",
        storage: "Almacenamiento",
        temperature: "Temperatura",
        coreTemp: "Core Temp",
        networkTraffic: "Tráfico de Red",
        download: "Descarga",
        upload: "Subida",
        used: "Usado",
        total: "Total",
        cores: "Núcleos",
        currentUsage: "Uso actual",
        partitionDetails: "Detalle de Particiones",
        timeParams: "Tiempos mostrados en",
        loading: "Cargando Dashboard...",
        noData: "Sin datos en el rango seleccionado",
        lastPoint: "Último punto",
        // Metrics
        cpu: "CPU (%)",
        ram: "RAM (%)",
        disk: "DISK (%)",
        net_rx: "Net RX (B/s)",
        net_tx: "Net TX (B/s)",
        temp: "Temp (°C)",
    },
    en: {
        footerDescription: "NocturneScope is the thesis for the Computer Execution Engineer degree seeking to formalize a platform for network management.",
        socialNetworks: "Social Networks",
        madeBy: "Made by",
        copyright: "Copyright ©",
        logoAltLight: "Light Logo",
        logoAltDark: "Dark Logo",
        // Navbar
        dashboard: "Dashboard",
        topology: "Topology",
        features: "Features",
        demo: "Demo",
        downloads: "Download",
        notifications: "Notifications",
        markAllRead: "Mark all as read",
        clearHistory: "Clear history",
        noNotifications: "No notifications",
        login: "Login",
        goToDashboard: "Go to Dashboard",
        myAccount: "My Account",
        apiTokens: "API Tokens",
        adminAccount: "Manage Account",
        adminUsers: "Manage Users",
        logout: "Logout",
        changeGroup: "Change Group",
        manageGroups: "Manage Groups",
        // Dashboard
        device: "Device",
        metric: "Metric",
        timeRange: "Time Range",
        noDevices: "No devices",
        status: "Status",
        systemUnknown: "Unknown System",
        network: "Network",
        storage: "Storage",
        temperature: "Temperature",
        coreTemp: "Core Temp",
        networkTraffic: "Network Traffic",
        download: "Download",
        upload: "Upload",
        used: "Used",
        total: "Total",
        cores: "Cores",
        currentUsage: "Current Usage",
        partitionDetails: "Partition Details",
        timeParams: "Times shown in",
        loading: "Loading Dashboard...",
        noData: "No data in selected range",
        lastPoint: "Last point",
        // Metrics
        cpu: "CPU (%)",
        ram: "RAM (%)",
        disk: "DISK (%)",
        net_rx: "Net RX (B/s)",
        net_tx: "Net TX (B/s)",
        temp: "Temp (°C)",
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
