export declare class YAMLWriter {
    private lines;
    _indent: number;
    private _firstInListItem;
    private get spaces();
    private parentSpaces;
    incIndent(): this;
    decIndent(): this;
    key(k: string): this;
    keyVal(k: string, v: string | number | boolean | null): this;
    keyQuoted(k: string, v: string): this;
    blockScalar(k: string, v: string): this;
    raw(line: string): this;
    indent(fn: () => void): this;
    parentLevel(fn: () => void): this;
    listItem(fn: () => void): this;
    toString(): string;
    private escapeDoubleQuoted;
    private needsQuoting;
    keySingleQuoted(k: string, v: string): this;
}
