/*

ChatGPT prompt:

There's a form at https://anti-captcha.com/demo/?page=recaptcha_v2_textarea with text inputs "login", "pass" and recaptcha v2 widget
which has its token stored in hidden input with name "g-recaptcha-response". The form submits POST request to address https://anti-captcha.com/demo/submit1.php .
If the captcha is solved successfully, then page outputs "Recaptcha test passed" text, if not, then "Captcha test not passed".
Recaptcha V2 has sitekey "6LfydQgUAAAAAMuh1gRreQdKjAop7eGmi6TrNIzp".
Write code which uses Anti-Captcha npm library to solve Recaptcha V2 and then submits token and form data.

Here's the example for solving Recaptcha v2 with Anti-Captcha:

//npm install @antiadmin/anticaptchaofficial
//https://github.com/anti-captcha/anticaptcha-npm

const ac = require("@antiadmin/anticaptchaofficial");

//set API key
ac.setAPIKey('YOUR_API_KEY_HERE');

//Specify softId to earn 10% commission with your app.
//Get your softId here: https://anti-captcha.com/clients/tools/devcenter
ac.setSoftId(0);

//set optional custom parameter which Google made for their search page Recaptcha v2
//ac.settings.recaptchaDataSValue = '"data-s" token from Google Search results "protection"'

ac.solveRecaptchaV2Proxyless('http://DOMAIN.COM', 'WEBSITE_KEY')
    .then(gresponse => {
        console.log('g-response: '+gresponse);
        console.log('google cookies:');
        console.log(ac.getCookies());
    })
    .catch(error => console.log('test received error '+error));


And here's the curl representation of POST request of the form. Rewrite it in javascript:

*/


const axios = require('axios');
const ac = require('@antiadmin/anticaptchaofficial');

// Set your Anti-Captcha API key
ac.setAPIKey('API_KEY_HERE');

// Solve Recaptcha V2
ac.solveRecaptchaV2Proxyless('https://anti-captcha.com/demo/?page=recaptcha_v2_textarea', '6LfydQgUAAAAAMuh1gRreQdKjAop7eGmi6TrNIzp')
    .then(recaptchaToken => {
        console.log('Recaptcha token:', recaptchaToken);

        // Submit form data with Recaptcha token
        const formData = {
            login: 'test', // Replace with actual login data
            pass: 'test', // Replace with actual password data
            'g-recaptcha-response': recaptchaToken
        };

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://anti-captcha.com/demo/?page=recaptcha_v2_textarea',
            // Add any other necessary headers from your curl command
        };

        axios.post('https://anti-captcha.com/demo/submit1.php', formData, { headers })
            .then(response => {
                console.log('Response from server:', response.data);
                // Check if Recaptcha test passed or failed based on response
                if (response.data.includes('Recaptcha test passed')) {
                    console.log('Recaptcha test passed!');
                } else {
                    console.log('Recaptcha test failed.');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
            });
    })
    .catch(error => {
        console.error('Error solving Recaptcha:', error);
    });
