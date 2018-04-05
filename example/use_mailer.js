/* eslint no-process-env: off */

const mailer = require('../index.js');
const path = require('path');

let connOptions = {
  sender: 'sender@gmail.com',
  dirTemplates: path.join(__dirname, 'templates/mail'),
  templates: [
    'confirm-register',
    'confirm-password'
  ]
};

if (process.env.MAIL_SERVICE) {
  connOptions = Object.assign(connOptions, {
    service: process.env.MAIL_SERVICE,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD
  });
}
mailer.connect(connOptions)
  .then(() => mailer.sendMail('josp.jorge@gmail.com', 'confirm-register', {
    href: 'https://site.domain.com/service?token=1234',
    userName: 'Name Perico'
  }))
  .then((infoSend) => {
    console.log('Preview URL: %s', mailer.getTestMessageUrl(infoSend));
    console.log('Body HTML =>');
    console.log(infoSend.message.html);
  });
