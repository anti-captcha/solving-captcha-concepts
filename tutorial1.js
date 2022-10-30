//npm install @antiadmin/anticaptchaofficial
//npm install puppeteer

const ac = require("@antiadmin/anticaptchaofficial");
const pup = require("puppeteer");

ac.setAPIKey('YOUR_API_KEY');
ac.getBalance()
    .then(balance => console.log('my balance is: '+balance))
    .catch(error => console.log('an error with API key: '+error));

const login = 'mylogin';
const password = 'my strong password';

(async () => {

    console.log('solving recaptcha ...');
    let token = await ac.solveRecaptchaV2Proxyless('https://anti-captcha.com/demo/?page=recaptcha_v2_textarea', '6LfydQgUAAAAAMuh1gRreQdKjAop7eGmi6TrNIzp');
    if (!token) {
        console.log('something went wrong');
        return;
    }

    console.log('opening browser ..');
    const browser = await pup.launch();

    console.log('creating new tab ..');
    const tab = await browser.newPage();

    console.log('changing window size .. ');
    await tab.setViewport({ width: 1360, height: 1000 });

    console.log('opening target page ..');
    await tab.goto('https://anti-captcha.com/demo/?page=recaptcha_v2_textarea', { waitUntil: "networkidle0" });

    console.log('filling login input ..');
    await tab.$eval('#contentbox > form > div > div:nth-child(1) > span > input', (element, login) => {
        element.value = login;
    }, login);

    console.log('filling password input');
    await tab.$eval('#contentbox > form > div > div:nth-child(2) > span > input', (element, password) => {
        element.value = password;
    }, password);

    console.log('setting recaptcha g-response ...');
    await tab.$eval('#g-recaptcha-response', (element, token) => {
        element.value = token;
    }, token);

    console.log('submitting form .. ');
    await Promise.all([
        tab.click('#contentbox > form > div > div.tac.padding20px > button'),
        tab.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    console.log('making a screenshot ...');
    await tab.screenshot({ path: 'screenshot.png' });

    console.log('closing browser .. ');
    await browser.close();

})();