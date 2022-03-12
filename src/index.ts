import {
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageProductionDefault,
} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import 'dotenv-safe/config';
import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import Redis from 'ioredis';
import { join } from 'path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import KnownMedia from './entities/KnownMedia';
import Media from './entities/Media';
import User from './entities/User';
import HelloResolver from './resolvers/hello';
import MediaResolver from './resolvers/media';
import UserResolver from './resolvers/user';
import { COOKIE_NAME, __prod__ } from './utils/constants';
import { MyContext } from './utils/types';

declare module 'express-session' {
	interface SessionData {
		userId: number;
	}
}

const main = async () => {
	const conn = await createConnection({
		type: 'postgres',
		url: process.env.DATABASE_URL,
		logging: !__prod__,
		synchronize: !__prod__,
		entities: [User, Media, KnownMedia],
		migrations: [join(__dirname, './migrations/*')],
		ssl: __prod__
			? {
					rejectUnauthorized: false,
					requestCert: __prod__,
			  }
			: undefined,
	});
	await conn.runMigrations();

	const app = express();

	const RedisStore = connectRedis(session);
	const redis = new Redis(process.env.REDIS_URL);

	const allowedOrigins = [
		process.env.CORS_ORIGIN,
		'https://studio.apollographql.com',
	];

	const corsOptions: cors.CorsOptions = {
		origin: (requestOrigin, callback) => {
			if (!requestOrigin) return callback(null, true);
			if (allowedOrigins.indexOf(requestOrigin) === -1)
				return callback(
					new Error(
						'The CORS policy for this site does not allow access from the specified Origin.'
					),
					false
				);
			return callback(null, true);
		},
		credentials: true,
	};

	app.set('trust proxy', !__prod__);
	app.use(cors(corsOptions));
	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 30,
				httpOnly: true,
				sameSite: 'none',
				secure: true,
				// domain: __prod__ ? '.the-wia.xyz' : ".apollograpql",
			},
			saveUninitialized: false,
			secret: process.env.SESSION_SECRET,
			resave: false,
		})
	);

	// create repositories
	const userRepository = conn.getRepository(User);
	const mediaRepository = conn.getRepository(Media);
	const knownMediaRepository = conn.getRepository(KnownMedia);

	const httpServer = createServer(app);
	const apolloPlugins = [ApolloServerPluginDrainHttpServer({ httpServer })];
	if (__prod__)
		apolloPlugins.push(ApolloServerPluginLandingPageProductionDefault());
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, UserResolver, MediaResolver],
			validate: false,
		}),
		plugins: apolloPlugins,
		context: ({ req, res }): MyContext => ({
			req,
			res,
			redis,
			userRepository,
			mediaRepository,
			knownMediaRepository,
		}),
	});

	await apolloServer.start();
	apolloServer.applyMiddleware({ app, cors: corsOptions });

	await new Promise<void>((resolve) =>
		httpServer.listen({ port: parseInt(process.env.PORT) }, resolve)
	);

	console.log(
		`🚀 Server ready at http://localhost:${process.env.PORT}${
			apolloServer.graphqlPath
		} in ${__prod__ ? 'production' : 'development'}`
	);
};

main().catch(console.error);
