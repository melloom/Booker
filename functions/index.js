// eslint-disable-next-line no-unused-vars
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure email transporter
let transporter;
try {
  const emailConfig = functions.config().email;
  if (!emailConfig || !emailConfig.user || !emailConfig.pass) {
    throw new Error("Email configuration is missing");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  });
} catch (error) {
  console.error("Error configuring email transporter:", error);
  // Create a dummy transporter that will log instead of sending
  transporter = {
    sendMail: async (options) => {
      console.log("Email would be sent:", options);
      return {messageId: "dummy"};
    },
  };
}

// Send cancellation email
exports.sendCancellationEmail = functions.firestore
    .document("cancelledBookings/{bookingId}")
    .onCreate(async (snap, context) => {
      const booking = snap.data();

      // Get user email
      const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(booking.userId)
          .get();

      const userData = userDoc.data();

      // Email to user
      const userMailOptions = {
        from: "WFM Appointment System <noreply@wfm.com>",
        to: userData.email,
        subject: "Appointment Cancellation Confirmation",
        html: [
          "<h2>Appointment Cancellation Confirmation</h2>",
          `<p>Dear ${userData.firstName} ${userData.lastName},</p>`,
          "<p>Your appointment has been cancelled with the following details:</p>",
          "<ul>",
          `<li><strong>Region:</strong> ${booking.region}</li>`,
          `<li><strong>Service:</strong> ${booking.product}</li>`,
          `<li><strong>Date:</strong> ${
            new Date(booking.date.toDate()).toLocaleDateString()
          }</li>`,
          `<li><strong>Time:</strong> ${booking.time}</li>`,
          `<li><strong>Cancellation Reason:</strong> ${
            booking.cancellationReason
          }</li>`,
          "</ul>",
          "<p>If you would like to reschedule, please visit our booking system.</p>",
          "<p>Thank you for your understanding.</p>",
        ].join("\n"),
      };

      // Email to admin
      const adminMailOptions = {
        from: "WFM Appointment System <noreply@wfm.com>",
        to: "admin@wfm.com",
        subject: "Appointment Cancellation Notification",
        html: [
          "<h2>Appointment Cancellation Notification</h2>",
          "<p>An appointment has been cancelled with the following details:</p>",
          "<ul>",
          `<li><strong>User:</strong> ${userData.firstName} ${
            userData.lastName
          }</li>`,
          `<li><strong>Email:</strong> ${userData.email}</li>`,
          `<li><strong>Region:</strong> ${booking.region}</li>`,
          `<li><strong>Service:</strong> ${booking.product}</li>`,
          `<li><strong>Date:</strong> ${
            new Date(booking.date.toDate()).toLocaleDateString()
          }</li>`,
          `<li><strong>Time:</strong> ${booking.time}</li>`,
          `<li><strong>Cancellation Reason:</strong> ${
            booking.cancellationReason
          }</li>`,
          "</ul>",
        ].join("\n"),
      };

      try {
        await transporter.sendMail(userMailOptions);
        await transporter.sendMail(adminMailOptions);
        console.log("Cancellation emails sent successfully");
      } catch (error) {
        console.error("Error sending cancellation emails:", error);
      }
    });
