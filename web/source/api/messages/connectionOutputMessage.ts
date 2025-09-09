import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

/**
 * Message to enable or disable the connection to a specific output.
 */
export class ConnectionOutputMessage extends BaseMessage
{
    public override readonly type: MessageType.ConnectionOutput;
    public readonly outputId: number;
    public readonly value: boolean;

    constructor (outputId: number, value: boolean)
    {
        super();

        this.type = MessageType.ConnectionOutput;
        this.outputId = outputId;
        this.value = value;
    }
}
