import * as Messages from "./messages";

export type GlobalMicrophone = Omit<Messages.GlobalMicrophone, 'type'>;
export type GlobalMuted = Omit<Messages.GlobalMuted, 'type'>;
export type OutputCompressorState = Omit<Messages.OutputCompressorState, 'type'>;
export type OutputCompressorValue = Omit<Messages.OutputCompressorValue, 'type'>;
export type OutputInputVolume = Omit<Messages.OutputInputVolume, 'type'>;
export type OutputMicrophoneVolume = Omit<Messages.OutputMicrophoneVolume, 'type'>;
export type OutputSoundVolume = Omit<Messages.OutputSoundVolume, 'type'>;
export type ConnectionBlender = Omit<Messages.ConnectionBlender, 'type'>;
export type ConnectionInput = Omit<Messages.ConnectionInput, 'type'>;
export type ConnectionOutput = Omit<Messages.ConnectionOutput, 'type'>;

// TODO: That's a monster of a type that probably could be simplified:
type NestedOmitType<T> = T extends Array<infer U>
    ? Array<NestedOmitType<U>>
    : T extends object
        ? { [K in Exclude<keyof T, 'type'>]: NestedOmitType<T[K]> }
        : T;

export type State = NestedOmitType<Messages.State>;
