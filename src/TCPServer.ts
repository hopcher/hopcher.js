import ServerOptions from "@interfaces/ServerOptions";
import { EventEmitter } from "events";
import { Server, Socket } from "net";
import Node from '@interfaces/Node';
import NodeState from "./enums/NodeState";
import EventType from "./enums/EventType";
import Message from "@interfaces/Message";
import EndpointExchangeMessage from "@interfaces/EndpointExchangeMessage";

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
            console.error(e);
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

            // JSON needs to parsed since we get a buffer
            const parsed = JSON.parse(data.toString('utf8')) as Message;

            switch (newNode.state) {
                case NodeState.ENDPOINT_EXCHANGE:
                    const data = parsed.d as EndpointExchangeMessage;

                    this.handleEndpointExchange(data, newNode, socket);
                    this.sendInitialHosts(socket);
                    
                    newNode.state = NodeState.OPERATIONAL;

                    break;
                default:
                    console.log("RAW", parsed);
                    break;
            }
        });

        /**
         * Upon socket close we want to get rid of that socket if it's
         * inside of trackedConnections
         */
        socket.on("close", () => {
            this.trackedConnections.delete(socket);
        });
    }

    /**
     * Whenever a new node connects
     * we want to inform them of the current list
     * of nodes they should connect to
     * @param socket A socket to send the hosts to
     */
    sendInitialHosts(socket: Socket) {
        // We want to send all of the sockets
        // while not including the current socket
        const filteredKeys = Array
            .from(this.trackedConnections.keys())
            .filter((s: Socket) => s != socket);

        const filteredSockets = filteredKeys
            .map((s: Socket) => this.trackedConnections.get(s));

        socket.write(JSON.stringify({
            op: "INITIAL_SOCKETS",
            d: filteredSockets
        }));
    }

    /**
     * @param data The endpoint exchange data
     * @param newNode The node which is assigned to this data
     * @param socket The socket which is assigned to this node
     */
    private handleEndpointExchange(data: EndpointExchangeMessage, newNode: Node, socket: Socket) {
        if (!data.hasOwnProperty("localAddress") || !data.hasOwnProperty("localPort"))
            throw "Missing localAddress or localPort"

        newNode.localPort = data.localPort;
        newNode.localAddress = data.localAddress;

        this.trackedConnections.set(socket, newNode);
    }
}