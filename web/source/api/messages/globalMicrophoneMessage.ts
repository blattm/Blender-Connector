import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

export class GlobalMicrophoneMessage extends BaseMessage
{
    public override readonly type: MessageType.GlobalMicrophone;
    public readonly value: boolean;

    constructor (value: boolean)
    {
        super();

        this.type = MessageType.GlobalMicrophone;
        this.value = value;
    }
}
