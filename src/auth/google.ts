import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JWT_EXPIRATION } from '@constants/constants';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (_accessToken, refreshToken, profile, done) => {
      try {
        const user = {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0].value || '',
          photo: profile.photos?.[0].value || '',
        };

        const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: JWT_EXPIRATION });

        done(null, { user, token });
      } catch (error) {
        done(error as any, undefined);
      }
    },
  ),
);

passport.serializeUser((userWithToken, done) => {
  done(null, userWithToken);
});

passport.deserializeUser((userWithToken, done) => {
  done(null, userWithToken as any);
});
