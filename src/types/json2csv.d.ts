declare module 'json2csv' {
  export interface Json2CsvOptions {
    fields?: string[] | Array<{ label: string; value: string | ((row: Record<string, unknown>) => unknown) }>;
    delimiter?: string;
    quote?: string;
    header?: boolean;
    transforms?: unknown[];
  }

  export class Parser {
    constructor(options?: Json2CsvOptions);
    parse(data: Record<string, unknown>[]): string;
  }

  export function parse(data: Record<string, unknown>[], options?: Json2CsvOptions): string;
}