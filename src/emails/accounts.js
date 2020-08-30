const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
  sgMail.send({
    to: email,
    from: "salaam001@hotmail.com",
    subject: "Welcome to our app",
    text: `Hello ${name}, welcome to our app!`
  });
};

const sendGoodByeMail = (email, name) => {
  sgMail.send({
    to: email,
    from: "salaam001@hotmail.com",
    subject: "Cancelation message",
    text: `Good bye ${name}, Hope to see you back again soon!`
  });
};

module.exports = { sendWelcomeMail, sendGoodByeMail };
