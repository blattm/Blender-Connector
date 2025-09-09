import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

/**
 * Message to enable or disable the compressor for a specific output.
 */
export class OutputCompressorStateMessage extends BaseMessage
{
    public override readonly type: MessageType.OutputCompressorState;
    public readonly outputId: number;
    public readonly value: boolean;

    constructor (outputId: number, value: boolean)
    {
        super();

        this.type = MessageType.OutputCompressorState;
        this.outputId = outputId;
        this.value = value;
    }
}
