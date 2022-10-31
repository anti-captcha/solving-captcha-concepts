const ac = require("@antiadmin/anticaptchaofficial");
const pup = require("puppeteer");

ac.setAPIKey('API_KEY_HERE');
ac.getBalance()
    .then(balance => console.log('my balance is: '+balance))
    .catch(error => console.log('an error with API key: '+error));

const myMessage = 'a test message';

(async () => {

    console.log('solving recaptcha ...');
    let token = await ac.solveRecaptchaV3('' +
        'https://anti-captcha.com/',
        '6LcBXcwZAAAAAC93rrscdoOawWRCm2MI5uFg2_Gt',
        0.3,
        'test');
    if (!token) {
        console.log('something went wrong');
        return;
    }

    console.log('opening browser ..');
    const browser = await pup.launch({
        headless: false,
        devtools: true,
        args: [
            '--window-size=1360,1000'
        ]
    });

    console.log('creating new tab ..');
    const tab = await browser.newPage();

    console.log('changing window size .. ');
    await tab.setViewport({ width: 1360, height: 1000 });


    console.log('opening target page ..');
    await tab.goto('https://anti-captcha.com/demo?page=recaptcha_v3_submit_03', { waitUntil: "networkidle0" });


    console.log('filling textarea ..');
    await tab.$eval('#message', (element, myMessage) => {
        element.value = myMessage;
        element.dispatchEvent(new Event('change'));
    }, myMessage);

    console.log('setting recaptcha g-response ...');
    await tab.evaluate((token) => {
        grecaptcha.execute = function(sitekey, payLoad) {
            console.log('called replaced execute function with sitekey '+sitekey+' and payload ', payLoad);
            return new Promise((resolve) => {
                resolve(token);
            });
        }
    }, token);


    await Promise.all([
        tab.click('#contentbox > div > div > div.tac.padding20px > button'),
        tab.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    //console.log('closing browser .. ');
    //await browser.close();

})();