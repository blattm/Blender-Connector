import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

/**
 * Message to set the volume for a specific input on a specific output.
 */
export class OutputInputVolumeMessage extends BaseMessage
{
    public override readonly type: MessageType.OutputInputVolume;
    public readonly outputId: number;
    public readonly inputId: number;
    public readonly value: number;

    constructor (outputId: number, inputId: number, value: number)
    {
        super();

        this.type = MessageType.OutputInputVolume;
        this.outputId = outputId;
        this.inputId = inputId;
        this.value = value;
    }
}
