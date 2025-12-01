import React from "react";
import { Container } from "@/components/landing/Container";
import { ScrollAnimation } from "@/components/landing/ScrollAnimation";
import {
    ChartBarIcon,
    ShareIcon,
    BellAlertIcon,
    ComputerDesktopIcon
} from "@heroicons/react/24/outline";

export const Features = () => {
    const features = [
        {
            title: "Monitoreo en Tiempo Real",
            description: "Visualiza el tráfico de red y métricas de rendimiento en vivo para una toma de decisiones instantánea.",
            icon: <ChartBarIcon className="w-8 h-8 text-primary" />,
        },
        {
            title: "Topología de Red",
            description: "Mapa interactivo que descubre y visualiza automáticamente la estructura y conexiones de tu red.",
            icon: <ShareIcon className="w-8 h-8 text-primary" />,
        },
        {
            title: "Alertas Inteligentes",
            description: "Sistema de detección de anomalías que te notifica sobre comportamientos sospechosos o fallos.",
            icon: <BellAlertIcon className="w-8 h-8 text-primary" />,
        },
        {
            title: "Multi-Plataforma",
            description: "Agentes ligeros y eficientes compatibles con sistemas Linux y Windows para una cobertura total.",
            icon: <ComputerDesktopIcon className="w-8 h-8 text-primary" />,
        },
    ];

    return (
        <div id="features" className="min-h-[80vh] flex flex-col justify-center scroll-mt-24 py-24 bg-muted/30 border-y border-border/50">
            <Container>
                <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-4">
                    {features.map((feature, index) => (
                        <ScrollAnimation
                            key={index}
                            animation="fade-up"
                            delay={index * 0.1}
                            className="h-full"
                        >
                            <div className="flex flex-col items-start p-6 bg-card border border-border rounded-xl h-full hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>

                <ScrollAnimation animation="fade-up" delay={0.4}>
                    <div className="mt-16 text-center w-full">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            NocturneScope transforma la manera en que gestionas la seguridad de tu red. Nuestra plataforma unifica el monitoreo en tiempo real, la visualización avanzada de topologías y un sistema de alertas proactivo en una sola interfaz intuitiva. Diseñada para escalar con tu infraestructura, ofrece la visibilidad profunda y el control que necesitas para identificar vulnerabilidades, optimizar el rendimiento y responder a incidentes con velocidad y precisión, sin importar la complejidad de tu entorno.
                        </p>
                    </div>
                </ScrollAnimation>
            </Container>
        </div>
    );
};
