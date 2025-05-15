const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');
const Handlebars = require('handlebars');

const compileTemplate = (templatePath, data) => {
  const source = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(source);
  return template(data);
};

const generatePDF = async ({ templatePath, data, outputPath = '/tmp/output.pdf' }) => {
  const html = compileTemplate(templatePath, data);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath || '/usr/bin/chromium-browser',
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return outputPath;
};

module.exports = {
    generatePDF
}