import nodemailer from 'nodemailer';

/**
 * sendEmail
 * @param {String} to - Email address of the receiver
 * @param {String} html - Message in html format to display in the email
 */
const sendEmail = async (to: string, html: string) => {
	let transporter = nodemailer.createTransport({
		service: 'SendinBlue',
		auth: {
			user: process.env.NODEMAILER_USER,
			pass: process.env.NODEMAILER_PASSWORD,
		},
	});

	const username = process.env.NODEMAILER_USERNAME.replace('_', ' ');

	const info = await transporter.sendMail({
		from: `${username} <${process.env.NODEMAILER_USER}>`,
		to,
		subject: 'Change password',
		html,
	});

	console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
