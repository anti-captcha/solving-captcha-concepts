const ac = require("@antiadmin/anticaptchaofficial");
const pup = require("puppeteer");
const express = require("express");
const app = express();

//serve resources from current folder
app.use(express.static(__dirname));
const server = app.listen(5000);

ac.setAPIKey('API_KEY_HERE');
ac.getBalance()
    .then(balance => console.log('my balance is: '+balance))
    .catch(error => console.log('an error with API key: '+error));

const login = 'mylogin';
const password = 'my strong password';

(async () => {

    console.log('solving recaptcha ...');
    let token = await ac.solveRecaptchaV2Proxyless('https://anti-captcha.com/', '6LdsBtAZAAAAAKD3r6e3kb4gclEXjpBXky65UbOP');
    if (!token) {
        console.log('something went wrong');
        return;
    }
    // let token = 'test';

    console.log('opening browser ..');
    const browser = await pup.launch({ headless: false });

    console.log('creating new tab ..');
    const tab = await browser.newPage();

    console.log('changing window size .. ');
    await tab.setViewport({ width: 1360, height: 1000 });

    console.log('setting interception rule ..');
    await tab.setRequestInterception(true);
    tab.on('request', (request) => {
       if (request.resourceType() === 'script' &&
           request.url().indexOf('anonymous.js') != -1) {
           console.log('aborting load of '+request.url());
           request.abort();
       } else {
           request.continue();
       }
    });

    console.log('opening target page ..');
    await tab.goto('https://anti-captcha.com/demo/?page=recaptcha_v2_anonymous_callback', { waitUntil: "networkidle0" });

    console.log('injecting local script ..');
    await tab.addScriptTag({url : 'http://localhost:5000/inject.js'});
    await tab.waitForTimeout(3000);

    console.log('filling login input ..');
    await tab.$eval('#login', (element, login) => {
        element.value = login;
        element.dispatchEvent(new Event('change'));
    }, login);

    console.log('filling password input');
    await tab.$eval('#pass', (element, password) => {
        element.value = password;
    }, password);

    console.log('setting recaptcha g-response ...');
    await tab.evaluate((token) => {
        checkCaptcha(token);
    }, token);


    await tab.waitForNavigation({ waitUntil: "networkidle0" })

    console.log('making a screenshot ...');
    await tab.screenshot({ path: 'screenshot.png' });

    //console.log('closing browser .. ');
    //await browser.close();

})();