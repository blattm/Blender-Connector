import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

/**
 * Message to set the compressor value for a specific output.
 */
export class OutputCompressorValueMessage extends BaseMessage
{
    public override readonly type: MessageType.OutputCompressorValue;
    public readonly outputId: number;
    public readonly value: number;

    constructor (outputId: number, value: number)
    {
        super();

        this.type = MessageType.OutputCompressorValue;
        this.outputId = outputId;
        this.value = value;
    }
}
