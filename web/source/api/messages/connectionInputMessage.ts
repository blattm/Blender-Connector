import { BaseMessage } from './baseMessage';
import { MessageType } from '../messageType';

export class ConnectionInputMessage extends BaseMessage
{
    public override readonly type: MessageType.ConnectionInput;
    public readonly inputId: number;
    public readonly value: boolean;

    constructor (inputId: number, value: boolean)
    {
        super();

        this.type = MessageType.ConnectionInput;
        this.inputId = inputId;
        this.value = value;
    }
}
