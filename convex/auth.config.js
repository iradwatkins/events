export default {
  providers: [
    {
      domain: "https://events.stepperslife.com",
      applicationID: "convex",
      // Verify JWTs using HMAC with shared secret
      verificationStrategy: {
        type: "hs256",
        secret: process.env.JWT_SECRET,
      },
    },
  ],
};
