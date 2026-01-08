
const passport = require('passport');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const cryptfuncs = require('../drivers/cryptfuncs');


const db = require('../models');

const crypt = new cryptfuncs();

// class passportcfg {

module.exports = () => {
	passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
	
	function(email, passwd, done) {
		return db.Users.findOne({where: {email: email}})
		.then(async (user) => {
			
			// check user is existed
			if(!user)	{
				return done('Incorrect email', false, {message: 'Incorrect email.'});
			}
			
			if(user.valid !== 'true')
				return done('invalid user', false, {message: 'invalid user.'});
			
			// compare password and passwd inputed
			let hash = await crypt.genhashedpasswd(passwd, user.salt);
			
			if(hash === user.passwd) {
				return done(null, user, {message: 'Signed In Successfully.'})
			}
			
			return done(null, false, {message: 'Incorrect password.'});			
		});
	}));
	
	passport.use(new JWTStrategy({
		jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
		secretOrKey: global.env.JWT_REFRESH_SECRET
	},
	function(jwtPayload, done) {
		return db.Users.findOneById(jwtPayload.id).then(user => {
			return done(null, user);
		}).catch(err => {
			return done(err);
		});
	}));
}

// }

// module.export = passportcfg;