import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { userModel } from '../models/user.model';
import { logger } from '../utils/logger';

export const configurePassport = (): void => {
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy (will be fully implemented when Google OAuth is set up)
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // Check if user exists
            let user = await userModel.findByEmail(profile.emails?.[0]?.value || '');

            if (user) {
              // User exists, return user
              return done(null, user);
            } else {
              // Create new user
              const email = profile.emails?.[0]?.value;
              if (!email) {
                return done(new Error('No email provided by Google'), undefined);
              }
              user = await userModel.create({
                email,
                name: profile.displayName || '',
                picture: profile.photos?.[0]?.value || null,
                provider: 'google',
              });
              return done(null, user);
            }
          } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error as Error, undefined);
          }
        }
      )
    );
  } else {
    logger.warn('Google OAuth credentials not configured');
  }
};

