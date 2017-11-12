const mailer = require('../index.js');
const path = require('path');

mailer.connect({
    sender: 'sender@gmail.com',
    dirTemplates: path.join(__dirname, 'templates/mail'),
    templates: ['confirm-register', 'confirm-password']
}).then(_=>{
    return mailer.sendMail('josp.jorge@gmail.com', 'confirm-register', {
	href: 'https://site.domain.com/service?token=1234',
	userName: 'Name'
    })
}).then(infoSend => {
    console.log('Preview URL: %s', mailer.getTestMessageUrl(infoSend));
    console.log('Body HTML =>');
    console.log(infoSend.message.html);
});
