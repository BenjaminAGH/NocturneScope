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
                                <path d="M13.18 20.27c-1.42-.06-2.58-.56-3.23-1.47-.84-1.18-.84-3.14-.84-3.14L9 12.53c-.14-.56-.36-1.1-.65-1.61-.3-.51-.68-.96-1.12-1.35-.44-.39-.94-.7-1.48-.92C5.2 8.43 4.68 8.31 4.15 8.31c-.53 0-1.05.12-1.54.34-.49.22-.93.53-1.3.92-.37.39-.67.84-.89 1.35-.22.51-.34 1.05-.34 1.61 0 .56.12 1.1.34 1.61.22.51.52.96.89 1.35.37.39.81.7 1.3.92.49.22 1.01.34 1.54.34.53 0 1.05-.12 1.54-.34.49-.22.93-.53 1.3-.92.37-.39.67-.84.89-1.35.22-.51.34-1.05.34-1.61 0-.56-.12-1.1-.34-1.61-.22-.51-.52-.96-.89-1.35-.37-.39-.81-.7-1.3-.92-.49-.22-1.01-.34-1.54-.34-.53 0-1.05.12-1.54.34-.49.22-.93.53-1.3.92-.37.39-.67.84-.89 1.35-.22.51-.34 1.05-.34 1.61 0 .56.12 1.1.34 1.61.22.51.52.96.89 1.35.37.39.81.7 1.3.92.49.22 1.01.34 1.54.34z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Linux (amd64)</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Compatible con la mayoría de distribuciones Linux modernas (Ubuntu, Debian, CentOS, etc).
                        </p>
                        <a
                            href="https://github.com/BenjaminAGH/NocturneScope/releases/latest/download/nocturne-agent-linux"
                            download
                            className="mt-auto flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Descargar para Linux
                        </a>
                        <div className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded w-full font-mono text-left overflow-x-auto">
                            wget https://github.com/BenjaminAGH/NocturneScope/releases/latest/download/nocturne-agent-linux<br />
                            chmod +x nocturne-agent-linux<br />
                            sudo ./nocturne-agent-linux
                        </div>
                    </div>

                    {/* Windows */}
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M0 3.449L9.75 2.1v9.451H0zm10.949-1.43L24 0v11.4H10.949zM0 12.6h9.75v9.451L0 20.699zm10.949 0H24V24l-13.051-1.843z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Windows (amd64)</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Ejecutable portable para Windows 10/11 y Server.
                        </p>
                        <a
                            href="https://github.com/BenjaminAGH/NocturneScope/releases/latest/download/nocturne-agent-windows.exe"
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
