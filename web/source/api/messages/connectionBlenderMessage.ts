import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

/**
 * Message to enable or disable the connection to Blender.
 */
export class ConnectionBlenderMessage extends BaseMessage
{
    public override readonly type: MessageType.ConnectionBlender;
    public readonly value: boolean;

    constructor (value: boolean)
    {
        super();

        this.type = MessageType.ConnectionBlender;
        this.value = value;
    }
}
