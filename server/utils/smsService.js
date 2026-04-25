let twilio;
try {
  twilio = require('twilio');
} catch (error) {
  console.warn('Twilio package not installed. Installing would require: npm install twilio');
  twilio = null;
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let client = null;
if (twilio && accountSid && authToken && twilioPhoneNumber) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio SMS service initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error.message);
  }
} else {
  if (!twilio) {
    console.warn('Twilio module not available. SMS functionality will be disabled.');
  } else {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
  }
}

const sendSMS = async (to, message) => {
  try {
    if (!client) {
      console.warn('Twilio client not initialized. SMS not sent.');
      return { success: false, message: 'SMS service not configured' };
    }

    // Ensure phone number has country code
    let phoneNumber = to;
    if (!phoneNumber.startsWith('+')) {
      // Add Sri Lanka country code if not present
      phoneNumber = '+94' + phoneNumber.replace(/^0/, '');
    }

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };