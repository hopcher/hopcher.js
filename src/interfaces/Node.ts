import NodeState from "src/enums/NodeState";

export default interface Node {
    readonly remoteAddress: string,
    readonly remotePort: number,
    localAddress?: string,
    localPort?: number

    state: NodeState;
}