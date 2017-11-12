const path = require('path');
const mailer = require('nodemailer');
const util = require('util');
const fs = require('fs');
const html2text = require('html-to-text');
const mustache = require('mustache');

const readFile =  util.promisify(fs.readFile);

let mailTransporter;
let templates = {};
let options;

exports.get = function() {
    return mailTransporter;
};

exports.getTestMessageUrl = mailer.getTestMessageUrl;

exports.sendMail = function(to, id, view) {
    const template = templates[id];
    const message = {
	subject: mustache.render(template.options.subject || '', view),
	from: options.sender,
	to: to,
	text: mustache.render(template.text, view),
	html: mustache.render(template.html, view)
    }
    
    return mailTransporter.sendMail(message)
	.then(infoSend => {
	    infoSend.message = {html: message.html};
	    return infoSend;
	});
}

function createTestAccount() {
    return mailer.createTestAccount().then(account => {
	// create reusable transporter object using the default SMTP transport
	return Promise.resolve(mailer.createTransport({
	    host: 'smtp.ethereal.email',
	    port: 587,
	    secure: false, // true for 465, false for other ports
	    auth: {
		user: account.user, // generated ethereal user
		pass: account.pass  // generated ethereal password
	    }
	}));
    });
};

function createNormalAccount() {
    return Promise.resolve(mailer.createTransport({
	host: options.host,
	port: options.port,
	secure: options.secure,
	auth: {
	    user: options.user,
	    pass: options.password
	}
    }));
}

function createAccount() {
    return options == null || options.host == null || options.host === '' ?
	    createTestAccount() : createNormalAccount();
}

function readTemplateBody(dir, id) {
    //console.log(`readTemplateBody(${dir}, ${id})`);
    return readFile(path.join(dir, id +'.html.mst'))
	.then(data => {
	    templates[id].html = data.toString();
	    return readFile(path.join(dir, id + '.text.mst'))
		.then(data=>{
		    templates[id].text = data.toString();
		})
		.catch(error => {
		    templates[id].text = html2text.fromString(templates[id].html);
		}).then(_ => {
		    return id
		})
	});
};

function readTemplate(dir, id) {
    //console.log(`readTemplate(${dir}, ${id})`);
    templates[id] = {};
    return readTemplateBody(dir, id)
	.then(_ => {
	    templates[id].options =
		require(path.join(dir, id + '.json'));
	    return id;
	});
};

function readAllTemplates(dir, ids) {
    return Promise.all(ids.map(readTemplate.bind(null, dir)))
};

exports.connect = function(_options) {
    options = _options;
    
    if(!options || options.sender==='') {
	throw Error('sender required in email options');
    }
    if(!options.dirTemplates) {
	throw Error('dirTemplates required in email options');
    }
    if(!Array.isArray(options.templates) || !options.templates.length) {
	throw Error('array templates required in email options');
    }
    if(!fs.statSync(options.dirTemplates).isDirectory()) {
	throw Error(`directory dirTemplates = ${options.dirTemplates} does not exists`);
    }
    return readAllTemplates(options.dirTemplates, options.templates)
	.then(createAccount)
	.then(transporter=>{mailTransporter=transporter});
}







