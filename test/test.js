/* global describe, it */
/* eslint global-require: "off" */

const mailer = require('../index');
const chai = require('chai');
const path = require('path');

chai.use(require('chai-as-promised'));
chai.use(require('chai-fs'));
chai.should();

describe('MAILTER-TEMPLATE', () => {
  describe('SMOKE TEST', () => {
    it('should connect & send mail',
      () => mailer.connect({
        sender: 'sender@gmail.com',
        dirTemplates: path.join(__dirname, 'fixture/templates'),
        templates: [
          'confirm-register',
          'confirm-password'
        ]
      })
      .then(() => mailer.sendMail('josp.jorge@gmail.com', 'confirm-register', {
        href: 'https://site.domain.com/service?token=1234',
        userName: 'Name'
      }))
      .then((infoSend) => {
        console.log('Preview URL: %s', mailer.getTestMessageUrl(infoSend));
        console.log('Body HTML =>');
        console.log(infoSend.message.html);
        return infoSend.message.html;
     }).should.be.fulfilled);
  });
});
