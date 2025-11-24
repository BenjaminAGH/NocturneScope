import React from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export const Downloads = () => {
    return (
        <div className="py-12 bg-muted/30 border-t border-border/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">Descarga el Agente</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Para comenzar a monitorear tus dispositivos, descarga y ejecuta el agente de NocturneScope en tus máquinas.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Linux */}
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.5 13.5c-.5 0-1.5.5-2.5 1s-2.5 1-3 1-2-.5-3-1-2-1-2.5-1c-1 0-2 .5-2.5 1.5s-1 2.5-1 3.5c0 2 1.5 3.5 3.5 3.5s2.5-1 3.5-1 1 .5 2 1 2.5 1 3.5 1c2 0 3.5-1.5 3.5-3.5 0-1-.5-2.5-1-3.5s-1.5-1.5-2.5-1.5zM12 2C9 2 7 3.5 7 6v2h10V6c0-2.5-2-4-5-4z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Linux (amd64)</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Compatible con la mayoría de distribuciones Linux modernas (Ubuntu, Debian, CentOS, etc).
                        </p>
                        <a
                            href="/downloads/nocturne-agent-linux"
                            download
                            className="mt-auto flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Descargar para Linux
                        </a>
                        <div className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded w-full font-mono text-left">
                            chmod +x nocturne-agent-linux<br />
                            sudo ./nocturne-agent-linux
                        </div>
                    </div>

                    {/* Windows */}
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 12V6.75L9 5.25V12H3ZM3 17.25V12H9V18.75L3 17.25ZM10 12V4.75L21 3V12H10ZM10 12V19.25L21 21V12H10Z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Windows (amd64)</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Ejecutable portable para Windows 10/11 y Server.
                        </p>
                        <a
                            href="/downloads/nocturne-agent-windows.exe"
                            download
                            className="mt-auto flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Descargar para Windows
                        </a>
                        <div className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded w-full font-mono text-left">
                            .\nocturne-agent-windows.exe
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
