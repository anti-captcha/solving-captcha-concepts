const puppeteer = require('puppeteer');
const ac = require("@antiadmin/anticaptchaofficial");

async function main() {

    //set API key
    ac.setAPIKey('API_KEY_HERE');

    //Specify softId to earn 10% commission with your app.
    //Get your softId here: https://anti-captcha.com/clients/tools/devcenter
    ac.setSoftId(0);

    //set optional custom parameter which Google made for their search page Recaptcha v2
    //ac.settings.recaptchaDataSValue = '"data-s" token from Google Search results "protection"'

    const token = await ac.solveRecaptchaV3('https://anti-captcha.com/demo/?page=recaptcha_v3_submit_03',
        '6LcBXcwZAAAAAC93rrscdoOawWRCm2MI5uFg2_Gt',
        0.9, //minimum score required: 0.3, 0.7 or 0.9
        'test')
    console.log('solved token:', token)

    // Launch a headless browser
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    }); // set headless to false to see the browser in action

    // Open a new page
    const page = await browser.newPage();

    // Intercept network requests
    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {
        // Block specific URL
        if (interceptedRequest.url().includes('https://www.google.com/recaptcha/api.js')) {
        interceptedRequest.abort();
        console.log('Blocked:', interceptedRequest.url());
        } else {
        interceptedRequest.continue();
        }
    });

    // Navigate to the desired page
    await page.goto('https://anti-captcha.com/demo/?page=recaptcha_v3_submit_03', {
        waitUntil: "domcontentloaded"
    }); // Replace with the URL you want to navigate to


    await page.evaluate((token) => {
        // Replacement for grecaptcha
        window['grecaptcha'] = {
            execute: function(sitekey, parameters) {
                console.log(`called execute function with sitekey ${sitekey} and parameters`, parameters)

                return new Promise(resolve => resolve(token))

            },
            ready: function(callback) {
                callback();
            }
        }
    }, token)


    console.log('page loaded, filling inputs');

    // Fill input fields
    await page.type('#message', 'the message', {delay: 100})

    console.log('submitting form..')
    await page.click('#contentbox > div > div > div.tac.padding20px > button');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extract all text content from the page
    const allTextContent = await page.evaluate(() => {
        // Get all text nodes
        const elements = document.querySelectorAll('*');
        const texts = [];

        // Iterate through all elements to extract text content
        elements.forEach(element => {
            const elementText = element.textContent.trim();
            if (elementText.length > 0) {
                texts.push(elementText);
            }
        });

        return texts.join('\n');
    });

    // Log or process the extracted text content
    console.log(allTextContent);

    if (allTextContent.includes('Recaptcha test passed')) {
        console.log('Recaptcha test passed!');
    } else {
        console.log('Recaptcha test failed.');
    }

    // Wait for some time (for demonstration purposes)
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Close the browser
    await browser.close();
}

// Run the main function
(async() => {
    main();
})();

