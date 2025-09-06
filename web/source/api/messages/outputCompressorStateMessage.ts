import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

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
