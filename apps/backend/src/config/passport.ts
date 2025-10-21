import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GithubStrategy } from "passport-github2";
import { prisma } from "db/client";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { providerId: profile.id },
        });
        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              name: profile.displayName,
              email: profile.emails?.[0]?.value ?? "",
              avatar: profile.photos?.[0]?.value ?? "",
              provider: "google",
              providerId: profile.id,
            },
          });
        }
        done(null, existingUser);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL: process.env.GITHUB_CALLBACK_URL || "",
    },
    async (
      accessToken: any,
      refreshToken: any,
      profile: {
        id: any;
        displayName: any;
        emails: { value: any }[];
        photos: { value: any }[];
      },
      done: (arg0: unknown, arg1: undefined) => void
    ) => {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { providerId: profile.id },
        });
        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              name: profile.displayName,
              email: profile.emails?.[0]?.value ?? "",
              avatar: profile.photos?.[0]?.value ?? "",
              provider: "github",
              providerId: profile.id,
            },
          });
          done(null, newUser);
        } else {
          done(null, existingUser);
        }
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id as string },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
