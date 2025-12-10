"use client";

import React from "react";
import { Container } from "@/components/landing/Container";
import { ScrollAnimation } from "@/components/landing/ScrollAnimation";
import {
    ChartBarIcon,
    ShareIcon,
    BellAlertIcon,
    ComputerDesktopIcon
} from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export const Features = () => {
    const { t } = useLanguage();
    const features = [
        {
            title: t('featureRealTime'),
            description: t('featureRealTimeDesc'),
            icon: <ChartBarIcon className="w-8 h-8 text-primary" />,
        },
        {
            title: t('featureTopology'),
            description: t('featureTopologyDesc'),
            icon: <ShareIcon className="w-8 h-8 text-primary" />,
        },
        {
            title: t('featureAlerts'),
            description: t('featureAlertsDesc'),
            icon: <BellAlertIcon className="w-8 h-8 text-primary" />,
        },
        {
            title: t('featureMultiPlatform'),
            description: t('featureMultiPlatformDesc'),
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
                            {t('featuresConclusion')}
                        </p>
                    </div>
                </ScrollAnimation>
            </Container>
        </div>
    );
};
