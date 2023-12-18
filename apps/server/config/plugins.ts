export default ({ env }) => ({
  // enable a plugin that doesn't require any configuration
  i18n: true,
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", "smtp.example.com"),
        port: env("SMTP_PORT", 587),
        auth: {
          user: env("SMTP_USERNAME"),
          pass: env("SMTP_PASSWORD"),
        },
      },
      settings: {
        defaultFrom: env("FROM_ADDRESS"),
        defaultReplyTo: env("REPLY_ADDRESS"),
      },
    },
  },
});
