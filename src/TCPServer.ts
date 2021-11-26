import ServerOptions from "@interfaces/ServerOptions";
import { EventEmitter } from "stream";

class TCPServer extends EventEmitter {
    /**
     * Options to pass for the server itself
     */
    readonly options: ServerOptions;
    
    /**
     * An array which tracks all of the available nodes
     * within the network
     */
    trackedConnections: Node[] = [];
    
    /**
     * @param options The options to dictate the behavior of the server
     */
    constructor(options: ServerOptions) {
        super(); // call the constructor of EventEmitter
        this.options = options;
    }
}