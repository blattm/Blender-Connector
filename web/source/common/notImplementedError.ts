export class NotImplementedError extends Error
{
    constructor (message?: string)
    {
        super(message ?? 'This functionality is not implemented yet.');
        this.name = 'NotImplementedError';
    }
}
