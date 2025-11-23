// Utility to play alert sounds using Web Audio API
// This generates synthetic sounds without needing external audio files

export type SoundType = 'beep' | 'chime' | 'warning' | 'urgent' | 'ping';

export const SOUND_OPTIONS = [
    { value: 'beep', label: 'Beep Clásico' },
    { value: 'chime', label: 'Campana' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'urgent', label: 'Alarma Urgente' },
    { value: 'ping', label: 'Ping Suave' },
] as const;

class SoundPlayer {
    private audioContext: AudioContext | null = null;

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
        const ctx = this.getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }

    private playMultiTone(tones: Array<{ frequency: number; duration: number; delay: number; type?: OscillatorType; volume?: number }>) {
        tones.forEach(({ frequency, duration, delay, type, volume }) => {
            setTimeout(() => {
                this.playTone(frequency, duration, type, volume);
            }, delay);
        });
    }

    play(soundType: SoundType) {
        switch (soundType) {
            case 'beep':
                // Classic beep - single tone
                this.playTone(800, 0.2, 'square', 0.3);
                break;

            case 'chime':
                // Notification chime - ascending tones
                this.playMultiTone([
                    { frequency: 523.25, duration: 0.15, delay: 0, type: 'sine', volume: 0.25 },    // C5
                    { frequency: 659.25, duration: 0.15, delay: 100, type: 'sine', volume: 0.25 },  // E5
                    { frequency: 783.99, duration: 0.3, delay: 200, type: 'sine', volume: 0.25 },   // G5
                ]);
                break;

            case 'warning':
                // Warning tone - alternating frequencies
                this.playMultiTone([
                    { frequency: 600, duration: 0.2, delay: 0, type: 'square', volume: 0.3 },
                    { frequency: 800, duration: 0.2, delay: 250, type: 'square', volume: 0.3 },
                    { frequency: 600, duration: 0.2, delay: 500, type: 'square', volume: 0.3 },
                ]);
                break;

            case 'urgent':
                // Urgent alarm - rapid pulses
                this.playMultiTone([
                    { frequency: 1000, duration: 0.1, delay: 0, type: 'sawtooth', volume: 0.35 },
                    { frequency: 1000, duration: 0.1, delay: 150, type: 'sawtooth', volume: 0.35 },
                    { frequency: 1000, duration: 0.1, delay: 300, type: 'sawtooth', volume: 0.35 },
                    { frequency: 1200, duration: 0.15, delay: 450, type: 'sawtooth', volume: 0.35 },
                ]);
                break;

            case 'ping':
                // Gentle ping - soft descending tone
                this.playMultiTone([
                    { frequency: 880, duration: 0.15, delay: 0, type: 'sine', volume: 0.2 },    // A5
                    { frequency: 659.25, duration: 0.2, delay: 100, type: 'sine', volume: 0.15 }, // E5
                ]);
                break;

            default:
                console.warn(`Unknown sound type: ${soundType}`);
        }
    }
}

// Singleton instance
const soundPlayer = new SoundPlayer();

export const playSound = (soundType: SoundType) => {
    soundPlayer.play(soundType);
};
