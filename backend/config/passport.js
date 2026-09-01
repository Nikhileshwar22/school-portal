const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const db = require("./db");


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
                process.env.GOOGLE_CALLBACK_URL
        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {

            try {

                const googleId = profile.id;

                const email =
                    profile.emails?.[0]?.value;

                const name =
                    profile.displayName ||
                    "Google User";


                if (!email) {

                    return done(
                        new Error(
                            "Google account email not available"
                        ),
                        null
                    );
                }


                // ==========================================
                // CHECK EXISTING USER
                // ==========================================

                const [users] =
                    await db.query(
                        `SELECT *
                         FROM users
                         WHERE email = ?`,
                        [email]
                    );


                if (users.length > 0) {

                    const user = users[0];


                    // ======================================
                    // UPDATE GOOGLE ID IF MISSING
                    // ======================================

                    if (!user.google_id) {

                        await db.query(
                            `UPDATE users
                             SET google_id = ?
                             WHERE id = ?`,
                            [
                                googleId,
                                user.id
                            ]
                        );

                        user.google_id =
                            googleId;
                    }


                    return done(
                        null,
                        user
                    );
                }


                // ==========================================
                // CREATE NEW GOOGLE USER
                // ==========================================
                //
                // IMPORTANT:
                // Google users are STUDENTS by default.
                //
                // They cannot create themselves as
                // ADMIN or TEACHER.
                //

                const [result] =
                    await db.query(

                        `INSERT INTO users
                        (
                            name,
                            email,
                            password,
                            role,
                            google_id
                        )
                        VALUES (?, ?, ?, ?, ?)`,

                        [
                            name,
                            email,
                            null,
                            "STUDENT",
                            googleId
                        ]
                    );


                const newUser = {

                    id: result.insertId,

                    name,

                    email,

                    password: null,

                    role: "STUDENT",

                    google_id: googleId
                };


                return done(
                    null,
                    newUser
                );

            } catch (error) {

                console.error(
                    "Google authentication error:",
                    error
                );

                return done(
                    error,
                    null
                );
            }
        }
    )
);


module.exports = passport;