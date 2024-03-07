declare module "mic" {
    export interface MicOptions {
        endian?: "big" | "little";
        bitwidth?: string;
        encoding?: "signed-integer" | "unsigned-integer";
        rate?: number;
        channels?: string;
        device?: string;
        exitOnSilence?: number;
        fileType?: string;
        debug?: boolean;
    }

    export interface MicInstance {
        start: () => void;
        stop: () => void;
        pause: () => void;
        resume: () => void;
        getAudioStream: () => NodeJS.ReadableStream;
    }

    export default function mic(options?: MicOptions): MicInstance;
}
