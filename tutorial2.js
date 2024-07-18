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

    const token = await ac.solveRecaptchaV2Proxyless('https://anti-captcha.com/demo/?page=recaptcha_v2_callback', '6LctBtAZAAAAANJDH7_ArYcwy0MxIfyfeMuZ5ywk')
    console.log('solved token:', token)

    // Launch a headless browser
    const browser = await puppeteer.launch({ 
        headless: "new" 
    }); // set headless to false to see the browser in action

    // Open a new page
    const page = await browser.newPage();

    // Navigate to the desired page
    await page.goto('https://anti-captcha.com/demo/?page=recaptcha_v2_callback', {
        waitUntil: "networkidle2"
    }); // Replace with the URL you want to navigate to
    console.log('page loaded, filling inputs');

    // Fill input fields
    await page.type('#login', 'the login', {delay: 500})
    await page.type('#pass', 'a password', {delay: 100})

    console.log('submitting token..')
    // Call the injected function on the page
    await page.evaluate((token) => {
        // Call the function with a specific token
        window.checkCaptcha(token);
    }, token); // Replace 'sometoken' with the actual token you want to pass

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

