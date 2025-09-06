import * as Messages from '.';
import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

export class StateMessage extends BaseMessage
{
    public override readonly type: MessageType.State;

    public readonly globalMicrophone: Messages.GlobalMicrophone;
    public readonly globalMuted: Messages.GlobalMuted;
    public readonly outputCompressorStates: Messages.OutputCompressorState[];
    public readonly outputCompressorValues: Messages.OutputCompressorValue[];
    public readonly outputInputVolumes: Messages.OutputInputVolume[][];
    public readonly outputMicrophoneVolumes: Messages.OutputMicrophoneVolume[];
    public readonly outputSoundVolumes: Messages.OutputSoundVolume[];
    public readonly connectionBlender: Messages.ConnectionBlender;
    public readonly connectionInputs: Messages.ConnectionInput[];
    public readonly connectionOutputs: Messages.ConnectionOutput[];

    constructor (
        globalMicrophone: Messages.GlobalMicrophone,
        globalMuted: Messages.GlobalMuted,
        outputCompressorStates: Messages.OutputCompressorState[],
        outputCompressorValues: Messages.OutputCompressorValue[],
        outputInputVolumes: Messages.OutputInputVolume[][],
        outputMicrophoneVolumes: Messages.OutputMicrophoneVolume[],
        outputSoundVolumes: Messages.OutputSoundVolume[],
        connectionBlender: Messages.ConnectionBlender,
        connectionInputs: Messages.ConnectionInput[],
        connectionOutputs: Messages.ConnectionOutput[]
    ) {
        super();

        this.type = MessageType.State;

        this.globalMicrophone = globalMicrophone;
        this.globalMuted = globalMuted;
        this.outputCompressorStates = outputCompressorStates;
        this.outputCompressorValues = outputCompressorValues;
        this.outputInputVolumes = outputInputVolumes;
        this.outputMicrophoneVolumes = outputMicrophoneVolumes;
        this.outputSoundVolumes = outputSoundVolumes;
        this.connectionBlender = connectionBlender;
        this.connectionInputs = connectionInputs;
        this.connectionOutputs = connectionOutputs;
    }
}
