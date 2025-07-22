import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Create a transporter (the service that will send the email)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `Cycle Bazaar <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. Actually send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;