mailer-template
=========
![build status](https://gitlab.com/jorge.suit/mailer-template/badges/master/build.svg)

Basic node module to send mails based on templates. It depends on
nodemailer to stablish connection with the mail server and mustache to
render the mail body from the template.

You have top provide in a given directory a set of mail templates. For
each temaplate at least two files need to be provided:

* body: `<template>.html.mst`
* options: `<template>.json`

where `<template>` is the name of the template.

You can also provide a body in text format in the file
`<template>.text.mst` but this file is optional. If the file is not
provided a text version is generated from the html using the package
`html-to-text`

The file `<template>.json` should contain a json object with a set of
options to be used while sending the email, this json object should
contains at least a fiel `subject` with the template for the subject
for the emil.


## Installation

  `npm install mailer-template`

## Usage

Below you can find an example based on the following directory structure:

```
├── templates
│   └── mail
│       ├── confirm-password.html.mst
│       ├── confirm-password.json
│       ├── confirm-register.html.mst
│       └── confirm-register.json
└── use_mailer.js
```
The code for `use_mailer.js` is:

```javascript
const mailer = require('mailer-template');
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
  .then(() => mailer.sendMail('user@gmail.com', 'confirm-register', {
    href: 'https://site.domain.com/service?token=1234',
    userName: 'Name Perico'
  }))
  .then((infoSend) => {
    console.log('Preview URL: %s', mailer.getTestMessageUrl(infoSend));
    console.log('Body HTML =>');
    console.log(infoSend.message.html);
  });
```

Following are the content of the template files for `confirm-register`

#### confirm-register.json
---
```javascript
{
    "subject": "Activate your account in The_Marvellouse_Account",
    "images": []
}
```

#### confirm-register.html.mst
---
```
<p>Hi {{userName}},</p>
<p>Thanks for signing up for The_Marvellouse_Service!</p>
<p>Please confirm your account at <a class=activate href="{{href}}">activate</a></p>
```

## Tests & lint

```
npm run lint
```

```
npm test
```

## Contributing

In lieu of a formal style guide, take care to maintain the existing
coding style. Add unit tests for any new or changed
functionality. Lint and test your code.


