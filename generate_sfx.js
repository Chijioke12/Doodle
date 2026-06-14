import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_RATE = 44100;

function saveWav(filename, audioFloat32) {
    // Clip back into [-1.0, 1.0] and convert to int16
    const numSamples = audioFloat32.length;
    const int16Array = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        let val = audioFloat32[i];
        if (val > 1.0) val = 1.0;
        if (val < -1.0) val = -1.0;
        int16Array[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
    }

    const dataSize = numSamples * 2; // 2 bytes per sample (16-bit)
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4); // Chunk size
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (1 for Mono)
    buffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
    buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Write PCM data
    for (let i = 0; i < numSamples; i++) {
        buffer.writeInt16LE(int16Array[i], 44 + i * 2);
    }

    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filename, buffer);
}

function createArray(durationSeconds) {
    return new Float32Array(Math.floor(SAMPLE_RATE * durationSeconds));
}

// Simple sliding window average for lowpass filtering
function smoothNoise(arr, windowSize, iterations = 1) {
    let current = arr;
    for (let it = 0; it < iterations; it++) {
        const next = new Float32Array(current.length);
        let sum = 0;
        for (let i = 0; i < windowSize && i < current.length; i++) {
            sum += current[i];
            next[i] = sum / (i + 1);
        }
        for (let i = windowSize; i < current.length; i++) {
            sum += current[i] - current[i - windowSize];
            next[i] = sum / windowSize;
        }
        current = next;
    }
    return current;
}

// -- Generators --

function generateJump() {
    const audio = createArray(0.3);
    const len = audio.length;
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 300 + (800 - 300) * (i / len);
        const wave = Math.sin(2 * Math.PI * freq * t);
        const env = Math.exp(-8 * t);
        audio[i] = wave * env;
    }
    return audio;
}

function generateShoot() {
    const audio = createArray(0.2);
    const len = audio.length;
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 1200 + (200 - 1200) * (i / len);
        const rand = (Math.random() * 2 - 1) * 0.2;
        const wave = Math.sin(2 * Math.PI * freq * t) + rand;
        const env = Math.exp(-15 * t);
        audio[i] = wave * env;
    }
    return audio;
}

function generateDefeat() {
    const audio = createArray(0.8);
    const len = audio.length;
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 400 + (100 - 400) * (i / len);
        const wave = Math.sin(2 * Math.PI * freq * t);
        const tremolo = 1 + 0.5 * Math.sin(2 * Math.PI * 10 * t);
        const env = 1.0 - (i / len);
        audio[i] = wave * tremolo * env;
    }
    return audio;
}

function generateSpring() {
    const audio = createArray(0.6);
    for (let i = 0; i < audio.length; i++) {
        const t = i / SAMPLE_RATE;
        const base_freq = 300 * Math.exp(-2 * t);
        const fm = 50 * Math.sin(2 * Math.PI * 20 * t) * Math.exp(-4 * t);
        const wave = Math.sin(2 * Math.PI * (base_freq + fm) * t);
        const env = Math.exp(-5 * t);
        audio[i] = wave * env;
    }
    return audio;
}

function generateMonsterDefeat() {
    const audio = createArray(0.5);
    const len = audio.length;
    let noise = new Float32Array(len);
    for (let i = 0; i < len; i++) noise[i] = Math.random() * 2 - 1;
    noise = smoothNoise(noise, 10, 3);
    
    let maxNoise = 0.001;
    for (let i = 0; i < len; i++) maxNoise = Math.max(maxNoise, Math.abs(noise[i]));
    
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 200 + (50 - 200) * (i / len);
        const tone = Math.sin(2 * Math.PI * freq * t);
        const env = Math.exp(-8 * t);
        audio[i] = ((noise[i] / maxNoise) * 0.8 + tone * 0.4) * env;
    }
    return audio;
}

function generatePlatformBreak() {
    const audio = createArray(0.3);
    for (let i = 0; i < audio.length; i++) {
        const t = i / SAMPLE_RATE;
        const noise = Math.random() * 2 - 1;
        const env = Math.exp(-20 * t);
        audio[i] = noise * env;
    }
    return audio;
}

function generatePowerup() {
    const audio = createArray(0.5);
    const freqs = [261.63, 329.63, 392.00, 523.25];
    for (let i = 0; i < freqs.length; i++) {
        const startIdx = Math.floor(i * 0.1 * SAMPLE_RATE);
        for (let j = startIdx; j < audio.length; j++) {
            const t = (j - startIdx) / SAMPLE_RATE;
            const env = Math.exp(-5 * t);
            audio[j] += Math.sin(2 * Math.PI * freqs[i] * t) * env;
        }
    }
    for (let i = 0; i < audio.length; i++) audio[i] *= 0.5;
    return audio;
}

function generateJetpack() {
    const audio = createArray(1.0);
    const len = audio.length;
    let noise = new Float32Array(len);
    for (let i = 0; i < len; i++) noise[i] = Math.random() * 2 - 1;
    noise = smoothNoise(noise, 50, 5);
    
    let maxNoise = 0.001;
    for (let i = 0; i < len; i++) maxNoise = Math.max(maxNoise, Math.abs(noise[i]));
    
    const fadeLen = Math.floor(SAMPLE_RATE * 0.1);
    for (let i = 0; i < len; i++) {
        let env = 1.0;
        if (i < fadeLen) env = i / fadeLen;
        else if (i > len - fadeLen) env = (len - i) / fadeLen;
        audio[i] = (noise[i] / maxNoise) * env * 0.8;
    }
    return audio;
}

function generatePropeller() {
    const audio = createArray(1.0);
    const fadeLen = Math.floor(SAMPLE_RATE * 0.1);
    for (let i = 0; i < audio.length; i++) {
        const t = i / SAMPLE_RATE;
        const wave = Math.pow(Math.sin(2 * Math.PI * 150 * t), 4);
        const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * 30 * t);
        let env = 1.0;
        if (i < fadeLen) env = i / fadeLen;
        else if (i > audio.length - fadeLen) env = (audio.length - i) / fadeLen;
        audio[i] = wave * am * env * 0.5;
    }
    return audio;
}

function generateUfo() {
    const audio = createArray(2.0);
    const fadeLen = Math.floor(SAMPLE_RATE * 0.2);
    for (let i = 0; i < audio.length; i++) {
        const t = i / SAMPLE_RATE;
        const fm = 50 * Math.sin(2 * Math.PI * 5 * t);
        const wave = Math.sin(2 * Math.PI * (300 + fm) * t);
        const am = 0.6 + 0.4 * Math.sin(2 * Math.PI * 2 * t);
        let env = 1.0;
        if (i < fadeLen) env = i / fadeLen;
        else if (i > audio.length - fadeLen) env = (audio.length - i) / fadeLen;
        audio[i] = wave * am * env;
    }
    return audio;
}

function generateBlackHole() {
    const audio = createArray(2.0);
    const len = audio.length;
    let noise = new Float32Array(len);
    for (let i = 0; i < len; i++) noise[i] = Math.random() * 2 - 1;
    noise = smoothNoise(noise, 20, 2);
    
    const peakIdx = Math.floor(SAMPLE_RATE * 1.5);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 400 + (20 - 400) * (i / len);
        const wave = Math.sin(2 * Math.PI * freq * t);
        
        let env = 0.0;
        if (i < peakIdx) env = i / peakIdx;
        else env = 1.0 - (i - peakIdx) / (len - peakIdx);
        
        audio[i] = (wave + noise[i] * 4.0) * env * 0.5;
    }
    return audio;
}

function generateTrampoline() {
    const audio = createArray(0.4);
    for (let i = 0; i < audio.length; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 600 * Math.exp(-10 * t);
        const wave = Math.sin(2 * Math.PI * freq * t);
        const env = Math.exp(-7 * t);
        audio[i] = wave * env;
    }
    return audio;
}

function main() {
    console.log("Generating SFX using pure Node.js/JavaScript...");
    const dest = path.join(__dirname, 'sfx'); // Output straight to /sfx inside the project root for consistency
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    saveWav(path.join(dest, 'jump.wav'), generateJump());
    saveWav(path.join(dest, 'shoot.wav'), generateShoot());
    saveWav(path.join(dest, 'defeat.wav'), generateDefeat());
    saveWav(path.join(dest, 'spring.wav'), generateSpring());
    saveWav(path.join(dest, 'monster_defeat.wav'), generateMonsterDefeat());
    saveWav(path.join(dest, 'platform_break.wav'), generatePlatformBreak());
    saveWav(path.join(dest, 'powerup.wav'), generatePowerup());
    saveWav(path.join(dest, 'jetpack.wav'), generateJetpack());
    saveWav(path.join(dest, 'propeller.wav'), generatePropeller());
    saveWav(path.join(dest, 'ufo.wav'), generateUfo());
    saveWav(path.join(dest, 'black_hole.wav'), generateBlackHole());
    saveWav(path.join(dest, 'trampoline.wav'), generateTrampoline());
    
    console.log(`SFX successfully generated in ${dest}/`);
}

main();
