interface ConversionOptions {
    title?: string;
    author?: string;
    date?: string;
    lang?: string;
    theme?: string;
    paperSize?: 'A4' | 'Letter' | 'Legal';
    margin?: string;
    fontSize?: string;
    [key: string]: any;
}
export declare class ContentConverter {
    private isProduction;
    private tempDir;
    constructor();
    private ensureDirectoryExists;
    convert(markdownContent: string, format: string, options?: ConversionOptions): Promise<Buffer | string>;
    private convertToMarkdown;
    private convertToHtml;
    private convertToPdfPuppeteer;
    private convertToPdfChrome;
    private convertToLatex;
    private convertToDocx;
    private convertToEpub;
    private convertToRtf;
    private convertToPlainText;
    private preprocessContent;
    private processMermaidDiagrams;
    private processMathExpressions;
    private setupCustomRenderer;
    private postProcessHtml;
    private generatePdfWithPuppeteer;
    private generatePdfWithChrome;
    private createMermaidOptimizedHtml;
    private markdownToLatex;
    private markdownToRtf;
    private escapeLatex;
    private createStyledHtml;
    private convertToPdfLatex;
    private convertToMp3;
}
export {};
