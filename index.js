const path = require('path');
const mailer = require('nodemailer');
const util = require('util');
const fs = require('fs');
const html2text = require('html-to-text');
const mustache = require('mustache');

const readFile = util.promisify(fs.readFile);

let mailTransporter = null;
const templates = {};
let options = null;

exports.get = () => mailTransporter;

exports.getTestMessageUrl = mailer.getTestMessageUrl;

exports.sendMail = (to, id, view) => {
  const template = templates[id];
  const message = {
    subject: mustache.render(template.options.subject || '', view),
    from: options.sender,
    to,
    text: mustache.render(template.text, view),
    html: mustache.render(template.html, view)
  };

  return mailTransporter.sendMail(message)
    .then((infoSend) => {
      infoSend.message = {
        html: message.html
      };
      return infoSend;
    });
};

function createTestAccount() {
  return mailer
    .createTestAccount()
    .then((account) => Promise.resolve(mailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      // true for 465, false for other ports
      secure: false,
      auth: {
        // generated ethereal user
        user: account.user,
        // generated ethereal password
        pass: account.pass
      }
    })));
}

function createNormalAccount() {
  let transOptions = {
    auth: {
      user: options.user,
      pass: options.password
    }
  };

  if ('service' in options) {
    transOptions.service = options.service;
  } else {
    transOptions = Object.assign(transOptions, {
      host: options.host,
      port: options.port,
      secure: options.secure
    });
  }
  return Promise.resolve(mailer.createTransport(transOptions));
}

function createAccount() {
  if ('service' in options || ('host' in options && 'port' in options)) {
    return createNormalAccount();
  }
  return createTestAccount();
}

function readTemplateBody(dir, id) {
  // console.log(`readTemplateBody(${dir}, ${id})`);
  return readFile(path.join(dir, `${id}.html.mst`))
    .then((dataHtml) => {
      templates[id].html = dataHtml.toString();
      return readFile(path.join(dir, `${id}.text.mst`))
        .then((dataText) => {
          templates[id].text = dataText.toString();
        })
        .catch(() => {
          templates[id].text = html2text.fromString(templates[id].html);
        })
        .then(() => id);
    });
}

function readTemplate(dir, id) {
  // console.log(`readTemplate(${dir}, ${id})`);
  templates[id] = {};
  return readTemplateBody(dir, id)
    .then(() => {
      // eslint-disable-next-line global-require
      templates[id].options = require(path.join(dir, `${id}.json`));
      return id;
    });
}

function readAllTemplates(dir, ids) {
  return Promise.all(ids.map(readTemplate.bind(null, dir)));
}

exports.connect = (_options) => {
  options = _options;

  if (!options || options.sender === '') {
    throw Error('sender required in email options');
  }
  if (!options.dirTemplates) {
    throw Error('dirTemplates required in email options');
  }
  if (!Array.isArray(options.templates) || !options.templates.length) {
    throw Error('array templates required in email options');
  }
  // eslint-disable-next-line no-sync
  if (!fs.statSync(options.dirTemplates).isDirectory()) {
    // eslint-disable-next-line max-len
    throw Error(`directory dirTemplates = ${options.dirTemplates} does not exists`);
  }
  return readAllTemplates(options.dirTemplates, options.templates)
    .then(createAccount)
    .then((transporter) => {
      mailTransporter = transporter;
    });
};
