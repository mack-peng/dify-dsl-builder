"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YAMLWriter = void 0;
class YAMLWriter {
    lines = [];
    _indent = 0; // used by node base
    _firstInListItem = false;
    get spaces() {
        return "  ".repeat(this._indent);
    }
    parentSpaces() {
        return "  ".repeat(Math.max(0, this._indent - 1));
    }
    incIndent() { this._indent++; return this; }
    decIndent() { this._indent = Math.max(0, this._indent - 1); return this; }
    key(k) {
        if (this._firstInListItem) {
            this.lines.push(`${this.parentSpaces()}- ${k}:`);
            this._firstInListItem = false;
        }
        else {
            this.lines.push(`${this.spaces}${k}:`);
        }
        return this;
    }
    keyVal(k, v) {
        if (this._firstInListItem) {
            this._firstInListItem = false;
            if (v === null) {
                this.lines.push(`${this.parentSpaces()}- ${k}: null`);
            }
            else if (v === undefined) {
                this.lines.push(`${this.parentSpaces()}- ${k}:`);
            }
            else {
                this.lines.push(`${this.parentSpaces()}- ${k}: ${v}`);
            }
        }
        else {
            if (v === null) {
                this.lines.push(`${this.spaces}${k}: null`);
            }
            else if (v === undefined) {
                this.lines.push(`${this.spaces}${k}:`);
            }
            else if (typeof v === "string" && v === "") {
                this.lines.push(`${this.spaces}${k}: ''`);
            }
            else if (typeof v === "string") {
                this.lines.push(`${this.spaces}${k}: ${v}`);
            }
            else {
                this.lines.push(`${this.spaces}${k}: ${v}`);
            }
        }
        return this;
    }
    keyQuoted(k, v) {
        if (typeof v !== "string") {
            return this.keyVal(k, v);
        }
        if (this._firstInListItem) {
            this._firstInListItem = false;
            this.lines.push(`${this.parentSpaces()}- ${k}: "${this.escapeDoubleQuoted(v)}"`);
            return this;
        }
        if (v === "") {
            this.lines.push(`${this.spaces}${k}: ''`);
            return this;
        }
        if (this.needsQuoting(v) || /^\d/.test(v) || v.length === 0) {
            this.lines.push(`${this.spaces}${k}: "${this.escapeDoubleQuoted(v)}"`);
        }
        else {
            this.lines.push(`${this.spaces}${k}: ${v}`);
        }
        return this;
    }
    blockScalar(k, v) {
        if (this._firstInListItem) {
            this._firstInListItem = false;
            if (!v) {
                this.lines.push(`${this.parentSpaces()}- ${k}: ""`);
                return this;
            }
            const strip = v.endsWith("\n") ? "|" : "|-";
            this.lines.push(`${this.parentSpaces()}- ${k}: ${strip}`);
            const lines = v.split("\n");
            for (const line of lines) {
                this.lines.push(`${this.spaces}${line}`);
            }
            return this;
        }
        if (!v) {
            this.lines.push(`${this.spaces}${k}: ""`);
            return this;
        }
        const strip = v.endsWith("\n") ? "|" : "|-";
        this.lines.push(`${this.spaces}${k}: ${strip}`);
        const lines = v.split("\n");
        for (const line of lines) {
            this.lines.push(`${this.spaces}  ${line}`);
        }
        return this;
    }
    raw(line) {
        if (this._firstInListItem) {
            this.lines.push(`${this.parentSpaces()}- ${line}`);
            this._firstInListItem = false;
        }
        else {
            this.lines.push(`${this.spaces}${line}`);
        }
        return this;
    }
    indent(fn) {
        this._indent++;
        fn();
        this._indent--;
        return this;
    }
    parentLevel(fn) {
        this._indent--;
        fn();
        this._indent++;
        return this;
    }
    listItem(fn) {
        this._firstInListItem = true;
        this._indent++;
        fn();
        this._indent--;
        return this;
    }
    toString() {
        return this.lines.join("\n") + "\n";
    }
    escapeDoubleQuoted(s) {
        return s
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n");
    }
    needsQuoting(v) {
        if (/^\d/.test(v) && v.length > 10)
            return true;
        if (/^(true|false|null|yes|no|on|off)$/i.test(v))
            return true;
        if (/[{}\[\],&*!|>'\"`]/.test(v))
            return true;
        if (/: |:$/.test(v))
            return true;
        if (v.startsWith("#") || /:\s*#/.test(v))
            return true;
        if (v.includes("{{") || v.includes("}}"))
            return true;
        return false;
    }
    keySingleQuoted(k, v) {
        const escaped = v.replace(/'/g, "''");
        if (this._firstInListItem) {
            this._firstInListItem = false;
            this.lines.push(`${this.parentSpaces()}- ${k}: '${escaped}'`);
        }
        else {
            this.lines.push(`${this.spaces}${k}: '${escaped}'`);
        }
        return this;
    }
}
exports.YAMLWriter = YAMLWriter;
