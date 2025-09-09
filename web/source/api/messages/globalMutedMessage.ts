import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

/**
 * Message to enable or disable the muting.
 */
export class GlobalMutedMessage extends BaseMessage
{
    public override readonly type: MessageType.GlobalMuted;
    public readonly value: boolean;

    constructor (value: boolean)
    {
        super();

        this.type = MessageType.GlobalMuted;
        this.value = value;
    }
}
