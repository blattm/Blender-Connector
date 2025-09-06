import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

export class OutputSoundVolumeMessage extends BaseMessage
{
    public override readonly type: MessageType.OutputSoundVolume;
    public readonly outputId: number;
    public readonly value: number;

    constructor (outputId: number, value: number)
    {
        super();

        this.type = MessageType.OutputSoundVolume;
        this.outputId = outputId;
        this.value = value;
    }
}
