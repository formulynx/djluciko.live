require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Discord APIからギルドメンバー情報を取得
async function getGuildMember(accessToken, guildId) {
    try {
        const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

// ALLOWED_ROLES_IN_GUILDSをパース
function parseRoleRequirements() {
    const config = process.env.ALLOWED_ROLES_IN_GUILDS || '';
    if (!config.trim()) return [];
    return config.split(',').map(pair => {
        const [guildId, roleId] = pair.split(':');
        return { guildId, roleId };
    }).filter(r => r.guildId && r.roleId);
}

// ロール条件をチェック
async function checkRoleRequirements(accessToken, userGuilds) {
    const roleRequirements = parseRoleRequirements();
    if (roleRequirements.length === 0) return false;

    const userGuildIds = userGuilds.map(g => g.id);

    for (const req of roleRequirements) {
        if (!userGuildIds.includes(req.guildId)) continue;

        const member = await getGuildMember(accessToken, req.guildId);
        if (member && member.roles && member.roles.includes(req.roleId)) {
            return true;
        }
    }
    return false;
}

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
	scope: ['identify', 'guilds', 'guilds.members.read']
},
(accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    process.nextTick(() => done(null, profile));
}));

app.get('/', async (req, res) => {
	if (req.isAuthenticated()) {

		const user = req.user;
		const guilds = req.user.guilds;
		const allowedGuildIds = process.env.ALLOWED_GUILD_IDS
			? process.env.ALLOWED_GUILD_IDS.split(',').filter(id => id.trim())
			: [];

		// 条件1: 許可されたサーバーに所属しているか
		let isMember = allowedGuildIds.length > 0 && guilds.some(guild => allowedGuildIds.includes(guild.id));

		// 条件2: 条件1がfalseの場合、特定サーバーの特定ロールを持っているかチェック
		if (!isMember) {
			isMember = await checkRoleRequirements(user.accessToken, guilds);
		}

		const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	    const jstTime = moment().tz("Asia/Tokyo").format('YYYY-MM-DD HH:mm:ss');
		console.log(`${jstTime},${ip},${user.username},${isMember}`);

		res.render('index', {
			authed: true,
			user: user,
			isMember: isMember,
			domain: process.env.SITE_DOMAIN,
			ivsStreamUrl: process.env.IVS_STREAM_URL
		});
	} else {
		res.render('index', {
			authed: false,
			user: null,
			isMember: false,
			domain: process.env.SITE_DOMAIN,
			ivsStreamUrl: process.env.IVS_STREAM_URL
		});
	}
});

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
	res.redirect('/');
});

app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.listen(3000, () => {
    // console.log('Listening on port 3000');
});