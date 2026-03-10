import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './constants';
import prisma from './database';
import crypto from 'crypto';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: `${config.apiUrl}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatarUrl = profile.photos?.[0]?.value;
          const firstName = profile.name?.givenName || profile.displayName || 'User';
          const lastName = profile.name?.familyName || '';

          if (!email) {
            return done(new Error('No email returned from Google'), undefined);
          }

          // 1. Already linked via googleId
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (user) {
            // Update avatar if Google has a newer one
            if (avatarUrl && user.avatarUrl !== avatarUrl) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { avatarUrl, lastLoginAt: new Date() },
              });
            } else {
              await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
              });
            }
            return done(null, user);
          }

          // 2. Email already exists — link Google to existing account
          const existingByEmail = await prisma.user.findUnique({
            where: { email },
          });

          if (existingByEmail) {
            user = await prisma.user.update({
              where: { id: existingByEmail.id },
              data: {
                googleId: profile.id,
                emailVerified: true,
                avatarUrl: avatarUrl || existingByEmail.avatarUrl,
                lastLoginAt: new Date(),
              },
            });
            return done(null, user);
          }

          // 3. Brand new user — create unassigned (same as regular register flow)
          const randomPassword = crypto.randomBytes(32).toString('hex');
          user = await prisma.user.create({
            data: {
              email,
              password: randomPassword, // unusable hash — Google users use OAuth
              firstName,
              lastName,
              googleId: profile.id,
              avatarUrl: avatarUrl || null,
              emailVerified: true, // Google already verified the email
              isActive: true,
              role: 'MEMBER',
              churchId: null, // unassigned — same flow as regular register
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}


export default passport;