// Setup for passport google authentication
/* eslint-disable */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
require('dotenv').config();
const { User } = require('../sequelize/index');
const dbHelpers = require('../sequelize/db-helpers');

// get information from user to create cookie to send to browser
passport.serializeUser((user, next) => {
  next(null, user.googleId); // possibly change to user.id
});


// take id from stored cookie sent from browser and find user
passport.deserializeUser((id, next) => {
  User.findOne({
    where: {
      googleId: id,
    },
  })
    .then((user) => {
      next(null, user);
    });
});

passport.use(
  new GoogleStrategy({
    callbackURL: '/auth/google/redirect',
    clientID: '831550743885-7a7f8m0t6pli22clvmresvbqg1uncdi1.apps.googleusercontent.com',
    clientSecret: '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',
  }, (accessToken, refreshToken, profile, next) => {
    console.log('checking shit');
    // check if user already exists in DB
    // find user with matching googleId and profile.id
    User.findOne({
      where: {
        googleId: profile.id,
      },
    })
      .then((currentUser) => {
        if (currentUser) {
          // if user exists
          next(null, currentUser);
        } else {
          // if user doesn't exist
          // use profile.id & profile.displayName for saving in db
          // create new sequelize User given ^
          User.create({
            username: profile.displayName,
            googleId: profile.id,
            isQuizzed: false,
            email: profile.emails[0].value,
          })
            .then((newUser) => {
              dbHelpers.createPreferences(newUser.dataValues.id);
              next(null, newUser);
            });
        }
      });
  }),
);
