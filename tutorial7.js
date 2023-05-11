//gmail password: your_app_password_here

//npm install @antiadmin/anticaptchaofficial

const ac = require("@antiadmin/anticaptchaofficial");

const config = {
    imap: {
        user: 'youremail@gmail.com',
        password: 'your_app_password_here',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
    }
};



(async() => {

    try {
        ac.setAPIKey('API_KEY_HERE');
        const balance = await ac.getBalance();
        console.log("API key balance: ", balance);
        if (balance <= 0) {
            console.error('Negative balance');
            return;
        }
    } catch (e) {
        console.log('could not retrieve balance: '+e.toString());
        return;
    }

    try {
        const email = "youremail+test"+Math.floor(Math.random()*10000000)+"@gmail.com";
        console.log("creating an account for email "+email);
        console.log('creating a task..');
        const taskId = await ac.sendAntiGateTask('https://antigate.com/socialnetwork/register.php',
            'Social network registration',
            {
                "email_var": email,
                "password_var": "thepassword123",
                "confirmation_code": "_WAIT_FOR_IT_"
            });

        console.log('created the task ', taskId);
        console.log('waiting 5 seconds');
        await ac.delay(5000); //some delay

        let confirmationCode;
        for (let i = 0; i < 120; i++) {
            confirmationCode = await checkMail();
            if (confirmationCode) {
                console.log('got the code:', confirmationCode);
                break;
            }
            await ac.delay(5000);
        }

        console.log("pushing confirmation code to worker's session")
        await ac.pushAntiGateVariable('confirmation_code', confirmationCode);

        console.log("waiting for final solution")
        const solution = await ac.waitForResult(taskId);

        console.log('solution:');
        console.log(solution);

    } catch (e) {
        console.error('Something went wrong: '+e.toString());
    }
})();




async function checkMail() {

    const imapsimple = require('imap-simple');

    console.log('opening a connection');
    let connection, confirmationCode
    try {
        connection = await imapsimple.connect(config);
    } catch (e) {
        console.log('could not open connection '+e.toString());
        return null;
    }

    console.log('opening INBOX')
    await connection.openBox('INBOX');

    console.log('getting list of messages from INBOX')
    const messages = await connection.search(['ALL'], { bodies: ['HEADER', 'TEXT'], struct: true });

    console.log("iterating through messages")
    for (const item of messages) {

        const subject = item.parts[1].body.subject[0];
        const body = item.parts[0].body;

        console.log(`found message with subject "${subject}"`)
        if (subject === 'Confirmation code') {

            const bodyDecoded = atob(body);
            console.log("Message content:\n", bodyDecoded);

            console.log("Extracting code")
            confirmationCode = bodyDecoded.match("code: (.*)\n")[1];
            console.log('Confirmation code: ', confirmationCode);

            console.log('Deleting message');
            await connection.deleteMessage(item.attributes.uid);
        }
    }
    console.log('closing IMAP connection');
    await connection.imap.closeBox(true, function(){});

    return confirmationCode; //returns null or a string

}