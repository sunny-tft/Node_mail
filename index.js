const express = require("express");
const dotenv = require("dotenv");
const app = express();
const mongoose = require("mongoose");
const connctDB = require("./config/db");
const Mail = require("./model/Mail");
dotenv.config({ path: "./config/config.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // hostname
  secureConnection: false, // TLS requires secureConnection to be false
  port: process.env.MAIL_PORT, // port for secure SMTP
  tls: {
    ciphers: "SSLv3"
  },
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.SENDER_MAIL_PASSWORD
  }
});
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

app.listen(3000, () => {
  console.log("server started at 3000");
  connctDB();
});

app.post("/sendMail", async (req, res) => {
  try {
    let mail = new Mail({
      from: process.env.SENDER_MAIL,
      to: req.body.to,
      subject: req.body.subject,
      text: req.body.text
    });
    await mail.validate();

    var mailOptions = {
      from: process.env.SENDER_MAIL, // sender address (who sends)
      to: req.body.to, // list of receivers (who receives)
      subject: req.body.subject, // Subject line
      text: req.body.text // plaintext body
    };
    const result = await transporter.sendMail(mailOptions);
    mail.success = true;
    await mail.save();
    res.status(200).send({ success: true, code: 200, result });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.send({
        success: false,
        code: 400,
        message: Object.values(error.errors)
          .map(value => value.message)
          .join(",")
      });
    }
    res.send(error);
  }
});

process.on("uncaughtException", (err, promise) => {
  console.log(`error: ${err.message}`);
  process.exit(1);
});
process.on("unhandledRejection", (err, promise) => {
  console.log(`error: ${err.message}`);
  process.exit(1);
});
