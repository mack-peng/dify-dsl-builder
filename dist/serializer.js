"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YAMLWriter = void 0;
class YAMLWriter {
    lines = [];
    _indent = 0;
    _firstInListItem = false;
    get spaces() {
        return "  ".repeat(this._indent);
    }
    parentSpaces() {
        return "  ".repeat(Math.max(0, this._indent - 1));
    }
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
            if (v === null || v === undefined) {
                this.lines.push(`${this.parentSpaces()}- ${k}:`);
            }
            else {
                this.lines.push(`${this.parentSpaces()}- ${k}: ${v}`);
            }
        }
        else {
            if (v === null || v === undefined) {
                this.lines.push(`${this.spaces}${k}:`);
            }
            else if (typeof v === "string") {
                if (v === "") {
                    this.lines.push(`${this.spaces}${k}: ''`);
                }
                else {
                    this.lines.push(`${this.spaces}${k}: ${v}`);
                }
            }
            else {
                this.lines.push(`${this.spaces}${k}: ${v}`);
            }
        }
        return this;
    }
    keyQuoted(k, v) {
        if (this._firstInListItem) {
            this._firstInListItem = false;
            this.lines.push(`${this.parentSpaces()}- ${k}: "${this.escapeDoubleQuoted(v)}"`);
            return this;
        }
        if (v.includes("\\") || v.includes('"') || v.includes("\n") || v.includes("\U")) {
            this.lines.push(`${this.spaces}${k}: "${this.escapeDoubleQuoted(v)}"`);
        }
        else if (this.needsQuoting(v)) {
            this.lines.push(`${this.spaces}${k}: '${v}'`);
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
            this.lines.push(`${this.parentSpaces()}- ${k}: |-`);
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
        this.lines.push(`${this.spaces}${k}: |-`);
        const lines = v.split("\n");
        for (const line of lines) {
            this.lines.push(`${this.spaces}  ${line}`);
        }
        return this;
    }
    raw(line) {
        this.lines.push(`${this.spaces}${line}`);
        return this;
    }
    indent(fn) {
        this._indent++;
        fn();
        this._indent--;
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
        return false;
    }
    keySingleQuoted(k, v) {
        if (this._firstInListItem) {
            this._firstInListItem = false;
            this.lines.push(`${this.parentSpaces()}- ${k}: '${v}'`);
        }
        else {
            this.lines.push(`${this.spaces}${k}: '${v}'`);
        }
        return this;
    }
}
exports.YAMLWriter = YAMLWriter;
