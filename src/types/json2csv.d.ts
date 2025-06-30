declare module 'json2csv' {
  export interface Json2CsvOptions {
    fields?: string[] | Array<{ label: string; value: string | ((row: any) => any) }>;
    delimiter?: string;
    quote?: string;
    header?: boolean;
    transforms?: any[];
  }

  export class Parser {
    constructor(options?: Json2CsvOptions);
    parse(data: any[]): string;
  }

  export function parse(data: any[], options?: Json2CsvOptions): string;
}