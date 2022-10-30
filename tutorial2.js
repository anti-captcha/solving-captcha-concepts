//npm install @antiadmin/anticaptchaofficial
//npm install puppeteer

const ac = require("@antiadmin/anticaptchaofficial");
const pup = require("puppeteer");

ac.setAPIKey('API_KEY_HERE');
ac.getBalance()
    .then(balance => console.log('my balance is: '+balance))
    .catch(error => console.log('an error with API key: '+error));

const login = 'mylogin';
const password = 'my strong password';

(async () => {

    // anchor URL, we use sitekey from here:
    // https://www.google.com/recaptcha/api2/anchor?ar=1&k=6LctBtAZAAAAANJDH7_ArYcwy0MxIfyfeMuZ5ywk&co=aHR0cHM6Ly9kb2NrZXIDKLEK41jYXB0Y2hhLmNvbTo0NDM.&hl=en&v=zmiYzsHiD3NTJBWt2QZC9aM5&size=normal&cb=be6fnap1p26e

    console.log('solving recaptcha ...');
    let token = await ac.solveRecaptchaV2Proxyless('https://anti-captcha.com/demo?page=recaptcha_v2_callback', '6LctBtAZAAAAANJDH7_ArYcwy0MxIfyfeMuZ5ywk');
    if (!token) {
        console.log('something went wrong');
        return;
    }

    console.log('opening browser ..');
    const browser = await pup.launch({ headless: false });

    console.log('creating new tab ..');
    const tab = await browser.newPage();

    console.log('changing window size .. ');
    await tab.setViewport({ width: 1360, height: 1000 });

    console.log('opening target page ..');
    await tab.goto('https://anti-captcha.com/demo/?page=recaptcha_v2_callback', { waitUntil: "networkidle0" });

    console.log('filling login input ..');
    await tab.$eval('#login', (element, login) => {
        element.value = login;
    }, login);

    console.log('filling password input');
    await tab.$eval('#pass', (element, password) => {
        element.value = password;
    }, password);

    console.log('setting recaptcha g-response ...');
    await tab.evaluate((token) => {
        checkCaptcha(token);
    }, token);


    console.log('making a screenshot ...');
    await tab.screenshot({ path: 'screenshot.png' });

    // console.log('closing browser .. ');
    // await browser.close();

})();