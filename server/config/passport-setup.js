import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js'; // User model ka path check kar lena

passport.use(
  new GoogleStrategy(
    {
      // Google se mili hui keys
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/users/auth/google/callback`, 
    },
    async (accessToken, refreshToken, profile, done) => {
      // Yeh function tab chalta hai jab user Google se successfully login kar leta hai
      try {
        // Check karo ki user pehle se database mein hai ya nahi
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Agar hai, to use aage bhej do
          return done(null, user);
        } else {
          // Agar user nahi hai, to check karo ki uss email se koi account hai ya nahi
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Agar email hai, to uss account ko Google ID se link kar do
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          } else {
            // Agar user bilkul naya hai, to naya account banao
            const newUser = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              isVerified: true, // Google se login karne wale verified hote hain
            });
            await newUser.save();
            return done(null, newUser);
          }
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);