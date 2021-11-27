export default interface Message {
    readonly op: string,
    readonly d: Record<string, any>;
}