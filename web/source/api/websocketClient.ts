// TODO: All this class does is adding "ws://" to the address. Is it really necessary?
// TODO: The autoconnect feature could be moved here.

export class WebSocketClient
{
    private websocket: WebSocket|null;
    private url: string|null;

    private onConnectedCallback: (() => void)|null;
    public set onConnected (callback: () => void)
    {
        this.onConnectedCallback = callback;
    }

    private onMessageCallback: ((data: string) => void)|null;
    public set onMessage (callback: (data: string) => void)
    {
        this.onMessageCallback = callback;
    }

    public onDisconnectedCallback: (() => void)|null;
    public set onDisconnected (callback: () => void)
    {
        this.onDisconnectedCallback = callback;
    }

    constructor ()
    {
        this.onConnectedCallback = null;
        this.onMessageCallback = null;
        this.onDisconnectedCallback = null;
        this.websocket = null;
        this.url = null;
    }

    public connect (address: string): void
    {
        this.url = `ws://${address}`;

        this.reconnect();
    }

    public reconnect (): void
    {
        if (this.url === null)
        {
            throw new Error("WebSocket URL is not set.");
        }

        this.websocket = new WebSocket(this.url);

        this.websocket.onopen = (): void => this.onConnectedCallback?.();
        this.websocket.onclose = (): void => this.onDisconnectedCallback?.();
        this.websocket.onmessage = (event: MessageEvent<string>): void => this.onMessageCallback?.(event.data);
    }

    public close (): void
    {
        if (this.websocket !== null)
        {
            this.websocket.close();
            this.websocket = null;
        }
    }

    public send (data: object): void
    {
        if (this.websocket === null)
        {
            throw new Error("WebSocket is not connected.");
        }

        const stringifiedData = JSON.stringify(data);

        this.websocket.send(stringifiedData);
    }
}
