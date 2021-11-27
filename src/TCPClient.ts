import ClientOptions from "@interfaces/ClientOptions";
import Message from "@interfaces/Message";
import EventEmitter from "events";
import { Server } from "http";
import { Socket } from "net";

export default class TCPClient extends EventEmitter {
    /**
     * Options to pass for the server itself
     */
    readonly options: ClientOptions;

    constructor(options: ClientOptions) {
        super();
        this.options = options;
    }

    /**
     * Connect to the rendezvous server with the options
     * supplied in the constructor
     */
    connect() {
        const socket = new Socket;

        /**
         * Initialize the socket connection to the
         * server
         */
        socket.connect({
            port: this.options.port,
            host: this.options.ip
        });

        socket.on("connect", () => {
            /**
             * When a client connects 
             * the first thing we want to do is to
             * exchange our local endpoints with the server
             * so we can become operational
             */
            socket.write(JSON.stringify({
                d: {
                    localAddress: socket.localAddress,
                    localPort: socket.localPort
                }
            }));
        });

        socket.on("data", (buffer: Buffer) => {
            try { JSON.parse(buffer.toString("utf8")); } catch { return; }

            const parsed: Message = JSON.parse(buffer.toString("utf8"));

            switch (parsed.op) {
                case "INITIAL_SOCKETS":
                    parsed.d.forEach((node: Node) => {
                        this.connectToNode(socket.localPort!, node);
                    });
                    break;

                case "NEW_CONNECTION":
                    this.connectToNode(socket.localPort!, parsed.d as Node);
                    break;
                default:
                    break;
            }
        })
    }

    /**
     * 
     * @param sPort The port used to connect to the rendzvous server
     * @param node The node we want to connect to
     */
    private connectToNode(sPort: number, node: Node) {
        // TODO
    }
}