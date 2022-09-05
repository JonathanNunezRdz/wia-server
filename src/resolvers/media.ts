import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	UseMiddleware,
} from 'type-graphql';
import Media from '../entities/Media';
import isAuth from '../middleware/isAuth';
import { MediaType, MyContext } from '../utils/types';

@ObjectType()
class PaginatedMedias {
	@Field(() => [Media])
	medias: Media[];

	@Field()
	hasMore: boolean;
}

@InputType()
class ImageInput {
	@Field()
	hasImage!: boolean;

	@Field({ nullable: true })
	imagePath: string;
}

@InputType()
class MediaInput {
	@Field()
	title: string;

	@Field(() => MediaType)
	type: MediaType;

	@Field(() => ImageInput)
	image: ImageInput;
}

@InputType()
class UpdateMediaInput extends MediaInput {
	@Field()
	id: number;
}

@Resolver(Media)
class MediaResolver {
	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async knowMedia(
		@Arg('mediaId', () => Int!) mediaId: number,
		@Arg('knownAt') knownAt: string,
		@Ctx()
		{
			req,
			mediaRepository,
			userRepository,
			knownMediaRepository,
		}: MyContext
	): Promise<boolean> {
		const realKnownAt = new Date(knownAt);
		const { userId } = req.session;

		const user = await userRepository.findOneOrFail(userId);
		const media = await mediaRepository.findOneOrFail(mediaId);
		const knownMedia = await knownMediaRepository.findOne({
			userId,
			mediaId,
		});

		// user does know the media but will change his knownAt date
		if (
			knownMedia &&
			knownMedia.knownAt.toISOString() !== realKnownAt.toISOString()
		) {
			try {
				knownMedia.knownAt = realKnownAt;
				await knownMedia.save();
				return true;
			} catch (error) {
				console.error('At update knowMedia', error);
				return false;
			}
		}

		// user doesn't know the media
		if (!knownMedia) {
			try {
				await knownMediaRepository.insert({
					user,
					media,
					knownAt: new Date(),
				});
			} catch (error) {
				console.error('At insert knowMedia', error);
				return false;
			}

			return true;
		}

		return false;
	}

	@Query(() => PaginatedMedias)
	async medias(
		@Arg('limit', () => Int!) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null,
		// @Arg('users', () => [Int]) users: number[],
		@Ctx() { mediaRepository }: MyContext
	): Promise<PaginatedMedias> {
		const realLimit = Math.min(50, limit);
		const realLimitPlusOne = realLimit + 1;
		// const medias = await mediaRepository.find({
		// 	where: {
		// 		createdAt: LessThan(cursor || new Date().toISOString()),
		// 	},
		// 	// where: (qb) => {
		// 	// 	qb.where('media."createdAt" < :cursor', {
		// 	// 		cursor: cursor || new Date().toISOString(),
		// 	// 	});
		// 	// },
		// 	order: {
		// 		createdAt: 'DESC',
		// 	},
		// 	take: realLimitPlusOne,
		// 	relations: ['knownMedias', 'knownMedias.user'],
		// });
		const medias = await mediaRepository
			.createQueryBuilder('media')
			.leftJoinAndSelect('media."knownMedias"', '"knownMedia"')
			.where('media."createdAt" < :cursor', {
				cursor: cursor || new Date().toISOString(),
			})
			.orderBy('media."createdAt"')
			.getMany();

		const sendMedias = medias.slice(0, realLimit).map((media) => {
			return {
				...media,
				knownMedias: media.knownMedias.sort((a, b) => {
					if (a.knownAt > b.knownAt) return 1;
					if (a.knownAt < b.knownAt) return -1;
					return 0;
				}),
			} as Media;
		});

		return {
			medias: sendMedias,
			hasMore: medias.length === realLimitPlusOne,
		};
	}

	@Query(() => Media, { nullable: true })
	async media(
		@Arg('id', () => Int!) id: number,
		@Ctx() { mediaRepository }: MyContext
	): Promise<Media> {
		return mediaRepository.findOneOrFail(id, {
			relations: ['knownMedias', 'knownMedias.user'],
		});
	}

	@Mutation(() => Media)
	@UseMiddleware(isAuth)
	async createMedia(
		@Arg('options') options: MediaInput,
		@Ctx()
		{ req, mediaRepository, knownMediaRepository }: MyContext
	): Promise<Media> {
		const { userId } = req.session;
		const mediaResult = await mediaRepository
			.createQueryBuilder()
			.insert()
			.values({
				...options,
			})
			.returning('id')
			.execute();
		const mediaId = mediaResult.raw[0].id as number;
		await knownMediaRepository.insert({
			userId,
			mediaId,
			knownAt: new Date(),
		});
		const media = await mediaRepository.findOneOrFail(mediaId, {
			relations: ['knownMedias', 'knownMedias.user'],
		});
		return media;
	}

	@Mutation(() => Media, { nullable: true })
	@UseMiddleware(isAuth)
	async updateMedia(
		@Arg('options') options: UpdateMediaInput,
		@Ctx() { req, mediaRepository }: MyContext
	): Promise<Media | null> {
		const media = await mediaRepository.findOneOrFail(options.id, {
			relations: ['knownMedia'],
		});

		if (
			media.knownMedias.findIndex(
				(mediaElement) => mediaElement.user.id === req.session.userId
			) !== -1
		)
			return null;

		media.title = options.title;
		media.type = options.type;
		media.image.hasImage = options.image.hasImage;
		media.image.imagePath = options.image.imagePath;
		await media.save();
		return media;
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async deleteMedia(
		@Arg('id', () => Int!) id: number,
		@Ctx() { mediaRepository, req }: MyContext
	): Promise<boolean> {
		const media = await mediaRepository.findOneOrFail(id, {
			relations: ['knownMedias', 'knownMedias.user'],
		});

		if (
			media.knownMedias.findIndex(
				(mediaElement) => mediaElement.user.id === req.session.userId
			) !== -1
		) {
			await media.remove();
			return true;
		}

		return false;
	}
}

export default MediaResolver;
