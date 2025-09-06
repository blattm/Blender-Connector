import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

export class OutputMicrophoneVolumeMessage extends BaseMessage
{
    public override readonly type: MessageType.OutputMicrophoneVolume;
    public readonly outputId: number;
    public readonly value: number;

    constructor (outputId: number, value: number)
    {
        super();

        this.type = MessageType.OutputMicrophoneVolume;
        this.outputId = outputId;
        this.value = value;
    }
}
