export declare class YAMLWriter {
    private lines;
    private _indent;
    private _firstInListItem;
    private get spaces();
    private parentSpaces;
    key(k: string): this;
    keyVal(k: string, v: string | number | boolean | null): this;
    keyQuoted(k: string, v: string): this;
    blockScalar(k: string, v: string): this;
    raw(line: string): this;
    indent(fn: () => void): this;
    listItem(fn: () => void): this;
    toString(): string;
    private escapeDoubleQuoted;
    private needsQuoting;
    keySingleQuoted(k: string, v: string): this;
}
