const puppeteer = require('puppeteer-core');

/**
 * Generates a PDF buffer from provided HTML using a remote headless browser (e.g., Browserless)
 * @param {Object} params
 * @param {string} params.html - Fully compiled HTML string
 * @param {Object} [params.pdfOptions] - Optional puppeteer PDF options
 * @param {string} [params.browserWSEndpoint] - Browserless or remote browser WebSocket endpoint
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
const generatePDF = async ({ html, pdfOptions = {}, browserWSEndpoint }) => {
  if (!html) {
    throw new Error("Missing required parameter: 'html'");
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: browserWSEndpoint || 'wss://chrome.browserless.io?token=2SJbs4OartWOV6u259b231a8f77e604a4b012fcb80b3d8d96'
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    ...pdfOptions
  });

  await browser.close();
  return pdfBuffer;
};

module.exports = {
  generatePDF
};
