require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Email endpoints
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
    
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// WhatsApp endpoints
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    let { to, body } = req.body;
    
    // Ensure phone number is in the correct format for Twilio
    to = to.replace(/\D/g, ''); // Remove non-digits
    if (!to.startsWith('598')) {
      to = '598' + to;
    }
    
    // Add Uruguay country code if not present
    const formattedNumber = to.startsWith('+') ? to : `+${to}`;
    
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
      body
    });
    
    res.status(200).json({ message: 'WhatsApp message sent successfully' });
  } catch (error) {
    console.error('WhatsApp error:', error);
    res.status(500).json({ 
      error: 'Failed to send WhatsApp message',
      details: error.message 
    });
  }
});

// Admin key email endpoint
app.post('/api/send-admin-key', async (req, res) => {
  try {
    const { email } = req.body;
    const adminKey = 'finzapp-admin-2023'; // In production, generate this securely
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'FinzApp - Clave de Acceso Administrador',
      html: `
        <h2>Clave de Acceso Administrador</h2>
        <p>Su clave de acceso es: <strong>${adminKey}</strong></p>
        <p>Use esta clave para acceder al panel de administración.</p>
        <p>Por razones de seguridad, esta clave expirará en 24 horas.</p>
      `
    });
    
    res.status(200).json({ message: 'Admin key sent successfully' });
  } catch (error) {
    console.error('Admin key email error:', error);
    res.status(500).json({ error: 'Failed to send admin key' });
  }
});

// Payment request email endpoint
app.post('/api/send-payment-request', async (req, res) => {
  try {
    const { email, amount, paymentType } = req.body;
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'FinzApp - Solicitud de Pago Premium',
      html: `
        <h2>Solicitud de Pago Premium</h2>
        <p>Se ha generado una solicitud de pago para su cuenta Premium:</p>
        <ul>
          <li>Monto: $${amount}</li>
          <li>Tipo: ${paymentType === 'monthly' ? 'Mensual' : 'Anual'}</li>
        </ul>
        <p>Para completar el pago, haga click en el siguiente enlace:</p>
        <a href="https://finzapp.com/payment?email=${email}&amount=${amount}&type=${paymentType}"
           style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Realizar Pago
        </a>
      `
    });
    
    res.status(200).json({ message: 'Payment request sent successfully' });
  } catch (error) {
    console.error('Payment request email error:', error);
    res.status(500).json({ error: 'Failed to send payment request' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});