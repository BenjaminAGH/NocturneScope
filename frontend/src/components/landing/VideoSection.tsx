import React from "react";
import { Container } from "@/components/landing/Container";
import { ScrollAnimation } from "@/components/landing/ScrollAnimation";
import { PlayIcon } from "@heroicons/react/24/solid";
import { useLanguage } from "@/context/LanguageContext";

export const VideoSection = () => {
    const { t } = useLanguage();
    return (
        <Container id="video" className="min-h-[60vh] flex flex-col justify-center scroll-mt-24 py-24">
            <ScrollAnimation animation="zoom-in">
                <div className="relative w-full max-w-4xl mx-auto aspect-video bg-muted rounded-2xl overflow-hidden border border-border shadow-2xl flex items-center justify-center group cursor-pointer">
                    {/* Background Placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />

                    {/* Play Button */}
                    <div className="relative z-10 w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <PlayIcon className="w-10 h-10 text-primary-foreground ml-1" />
                    </div>

                    {/* Overlay Text */}
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                        <p className="text-lg font-medium text-muted-foreground">
                            {t('videoComingSoon')}
                        </p>
                    </div>
                </div>
            </ScrollAnimation>
        </Container>
    );
};
