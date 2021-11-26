import NodeState from "src/enums/NodeState";

export default interface Node {
    readonly remoteAddress: string,
    readonly remotePort: number,
    readonly localAddress?: string,
    readonly localPort?: string

    state: NodeState;
}