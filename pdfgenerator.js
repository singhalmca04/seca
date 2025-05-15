const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Util: Read file and compile Handlebars template
const compileTemplate = (templatePath, data) => {
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);
    return template(data);
};

const generatePDF = async (templatePath, data) => {
    const html = compileTemplate(templatePath, data);

    const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
};


module.exports = {
    generatePDF
}