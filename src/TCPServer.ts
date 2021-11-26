import ServerOptions from "@interfaces/ServerOptions";
import { EventEmitter } from "events";
import { Server, Socket} from "net";
import Node from '@interfaces/Node';
import NodeState from "./enums/NodeState";
import EventType from "./enums/EventType";
import Message from "@interfaces/Message";

export default class TCPServer extends EventEmitter {
    /**
     * Options to pass for the server itself
     */
    readonly options: ServerOptions;
    
    /**
     * An array which tracks all of the available nodes
     * within the network
     */
    trackedConnections: Map<Socket, Node> = new Map;
    
    /**
     * @param options The options to dictate the behavior of the server
     */
    constructor(options: ServerOptions) {
        super(); // call the constructor of EventEmitter
        this.options = options;
    }

    /**
     * Power up the server, events will emit accordingly
     */
    listen() {
        const server = new Server();

        server.on("error", (e) => {
            throw e;
        });

        server.on("connection", this.handleConnection.bind(this));

        server.listen(this.options.port, () => {
            this.emit(EventType.READY)
        });
    }

    /**
     * Handle each connection async-ly from the connect loop
     * @param socket The socket object from the connection
     */
    handleConnection(socket: Socket) {
        const newNode: Node = {
            remoteAddress: socket.remoteAddress!,
            remotePort: socket.remotePort!,
            state: NodeState.ENDPOINT_EXCHANGE
        };

        this.emit(EventType.CONNECTION, newNode);

        /**
         * Listen for data from the node, the first message
         * should be an handshaking once where the node sends it's endpoints
         */
        socket.on("data", (data: Buffer) => {
            try { JSON.parse(data.toString()) } catch { return }

            const parsed = JSON.parse(data.toString('utf8')) as Message;
            
            switch (newNode.state) {
                case NodeState.ENDPOINT_EXCHANGE:
                    console.log(parsed);
                    break;
                default:
                    console.log("RAW", parsed);
                    break;
            }
        });
    }
}