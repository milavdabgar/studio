import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

// ChartJSNodeCanvas options
const width = 800; // px
const height = 400; // px
const backgroundColour = 'white'; // Necessary for non-transparent backgrounds in PDF

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

export async function generateChartImage(configuration: ChartConfiguration): Promise<Buffer> {
    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateChartBase64(configuration: ChartConfiguration): Promise<string> {
    const buffer = await generateChartImage(configuration);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}
