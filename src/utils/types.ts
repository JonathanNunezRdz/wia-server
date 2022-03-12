import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { registerEnumType } from 'type-graphql';
import { Repository } from 'typeorm';
import KnownMedia from '../entities/KnownMedia';
import Media from '../entities/Media';
import User from '../entities/User';

export enum MediaType {
	ANIME = 'anime',
	MANGA = 'manga',
	VIDEOGAME = 'videogame',
}

registerEnumType(MediaType, {
	name: 'MediaType',
	description: 'Type of the media: anime | manga | videogame',
});

export type MyContext = {
	req: Request;
	res: Response;
	redis: Redis;
	userRepository: Repository<User>;
	mediaRepository: Repository<Media>;
	knownMediaRepository: Repository<KnownMedia>;
};
