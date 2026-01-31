import emailjs from '@emailjs/browser';
import { env } from '../config/emailjs.config';

// Initialize EmailJS with public key
emailjs.init(env.EMAILJS_PUBLIC_KEY);

export const sendTeamInviteEmail = async (
  recipientEmail: string,
  teamName: string,
  inviterName: string,
  role: string
) => {
  try {
    console.log('Sending email with params:', {
      email: recipientEmail,
      teamName,
      inviterName,
      role
    });

    const templateParams = {
      email: recipientEmail, // Matches {{email}} in EmailJS template
      to_name: recipientEmail.split('@')[0],
      title: teamName, // For subject line
      invite_link: `${window.location.origin}/dashboard`,
      team_name: teamName,
      inviter_name: inviterName,
      role: role,
      app_url: window.location.origin,
      accept_url: `${window.location.origin}/dashboard`
    };

    const response = await emailjs.send(
      env.EMAILJS_SERVICE_ID,
      env.EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
