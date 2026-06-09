export class YAMLWriter {
  private lines: string[] = [];
  private _indent = 0;
  private _firstInListItem = false;

  private get spaces(): string {
    return "  ".repeat(this._indent);
  }

  private parentSpaces(): string {
    return "  ".repeat(Math.max(0, this._indent - 1));
  }

  key(k: string): this {
    if (this._firstInListItem) {
      this.lines.push(`${this.parentSpaces()}- ${k}:`);
      this._firstInListItem = false;
    } else {
      this.lines.push(`${this.spaces}${k}:`);
    }
    return this;
  }

  keyVal(k: string, v: string | number | boolean | null): this {
    if (this._firstInListItem) {
      this._firstInListItem = false;
      if (v === null || v === undefined) {
        this.lines.push(`${this.parentSpaces()}- ${k}:`);
      } else {
        this.lines.push(`${this.parentSpaces()}- ${k}: ${v}`);
      }
    } else {
      if (v === null || v === undefined) {
        this.lines.push(`${this.spaces}${k}:`);
      } else if (typeof v === "string") {
        if (v === "") {
          this.lines.push(`${this.spaces}${k}: ''`);
        } else {
          this.lines.push(`${this.spaces}${k}: ${v}`);
        }
      } else {
        this.lines.push(`${this.spaces}${k}: ${v}`);
      }
    }
    return this;
  }

  keyQuoted(k: string, v: string): this {
    if (this._firstInListItem) {
      this._firstInListItem = false;
      this.lines.push(`${this.parentSpaces()}- ${k}: "${this.escapeDoubleQuoted(v)}"`);
      return this;
    }

    if (v.includes("\\") || v.includes('"') || v.includes("\n") || v.includes("\U")) {
      this.lines.push(`${this.spaces}${k}: "${this.escapeDoubleQuoted(v)}"`);
    } else if (this.needsQuoting(v)) {
      this.lines.push(`${this.spaces}${k}: '${v}'`);
    } else {
      this.lines.push(`${this.spaces}${k}: ${v}`);
    }
    return this;
  }

  blockScalar(k: string, v: string): this {
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

  raw(line: string): this {
    this.lines.push(`${this.spaces}${line}`);
    return this;
  }

  indent(fn: () => void): this {
    this._indent++;
    fn();
    this._indent--;
    return this;
  }

  listItem(fn: () => void): this {
    this._firstInListItem = true;
    this._indent++;
    fn();
    this._indent--;
    return this;
  }

  toString(): string {
    return this.lines.join("\n") + "\n";
  }

  private escapeDoubleQuoted(s: string): string {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
  }

  private needsQuoting(v: string): boolean {
    if (/^\d/.test(v) && v.length > 10) return true;
    if (/^(true|false|null|yes|no|on|off)$/i.test(v)) return true;
    return false;
  }

  keySingleQuoted(k: string, v: string): this {
    if (this._firstInListItem) {
      this._firstInListItem = false;
      this.lines.push(`${this.parentSpaces()}- ${k}: '${v}'`);
    } else {
      this.lines.push(`${this.spaces}${k}: '${v}'`);
    }
    return this;
  }
}
