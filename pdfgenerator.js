const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');
const Handlebars = require('handlebars');

const compileTemplate = (templatePath, data) => {
  const source = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(source);
  return template(data);
};

const generatePDF = async ({ templatePath, data }) => {
  const html = compileTemplate(templatePath, data);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return pdfBuffer;
};

module.exports = {
  generatePDF
};
