import { hash, verify } from 'argon2';
import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	InputType,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
} from 'type-graphql';
import { v4 } from 'uuid';
import User from '../entities/User';
import { capitalize } from '../utils';
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../utils/constants';
import getKeyConstraint from '../utils/getKeyConstraint';
import sendEmail from '../utils/sendEmail';
import { MyContext } from '../utils/types';
import validateEmail from '../utils/validateEmail';
import validateRegister from '../utils/validateRegister';

@ObjectType()
export class FieldError {
	@Field()
	field: string;

	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field({ nullable: true })
	user?: User;
}

@InputType()
export class RegisterInput {
	@Field()
	email: string;

	@Field()
	username: string;

	@Field()
	password: string;

	@Field()
	firstName: string;

	@Field()
	lastName: string;
}

@Resolver(User)
class UserResolver {
	@FieldResolver(() => String)
	email(@Root() user: User, @Ctx() { req }: MyContext): string {
		if (req.session.userId === user.id) return user.email;
		return '';
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { redis, req, userRepository }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 6)
			return {
				errors: [
					{
						field: 'newPassword',
						message: 'Password length must be greater than 6',
					},
				],
			};

		const key = `${FORGOT_PASSWORD_PREFIX}${token}`;
		const id = await redis.get(key);

		if (!id)
			return {
				errors: [
					{
						field: 'token',
						message: 'Token expired',
					},
				],
			};

		const userId = parseInt(id);
		const user = await userRepository.findOne(userId);

		if (!user)
			return {
				errors: [
					{
						field: 'token',
						message: 'User no longer exists',
					},
				],
			};

		user.password = await hash(newPassword);
		await user.save();
		await redis.del(key);

		req.session.userId = user.id;
		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() { redis, userRepository }: MyContext
	): Promise<boolean> {
		const user = await userRepository.findOne({ where: { email } });
		if (!user) return true;

		const token = v4();
		await redis.set(
			`${FORGOT_PASSWORD_PREFIX}${token}`,
			user.id,
			'ex',
			1000 * 60 * 60 * 24 * 3
		);

		await sendEmail(
			email,
			`<a href="${process.env.CORS_ORIGIN}/change-password/${token}">Reset your password</a>`
		);

		return true;
	}

	@Query(() => User, { nullable: true })
	async me(@Ctx() { req, userRepository }: MyContext): Promise<User | null> {
		if (!req.session.userId) return null;
		return userRepository.findOneOrFail(req.session.userId);
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: RegisterInput,
		@Ctx() { req, userRepository }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options);
		if (errors) return { errors };

		const hashedPassword = await hash(options.password);

		try {
			const result = await userRepository
				.createQueryBuilder()
				.insert()
				.values({
					username: options.username,
					email: options.email,
					firstName: options.firstName,
					lastName: options.lastName,
					password: hashedPassword,
				})
				.returning('id')
				.execute();
			const id = result.raw[0].id as number;
			const user = await userRepository.findOneOrFail(id);
			req.session.userId = user.id;
			return { user };
		} catch (error) {
			if (error.code === '23505') {
				const key = getKeyConstraint(error.detail, [
					'email',
					'username',
				]);
				return {
					errors: [
						{
							field: key,
							message: `${capitalize(
								key
							)} has already been taken`,
						},
					],
				};
			} else {
				return {
					errors: [
						{
							field: 'server',
							message: 'internal server error',
						},
					],
				};
			}
		}
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req, userRepository }: MyContext
	): Promise<UserResponse> {
		let key: 'username' | 'email' = 'username';
		if (usernameOrEmail.includes('@') && validateEmail(usernameOrEmail))
			key = 'email';
		const user = await userRepository.findOne({
			where: { [key]: usernameOrEmail },
		});
		if (!user)
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: `${capitalize(key)} doesn't exists`,
					},
				],
			};

		const valid = await verify(user.password, password);
		if (!valid)
			return {
				errors: [
					{
						field: 'password',
						message: 'Incorrect password',
					},
				],
			};

		req.session.userId = user.id;
		return { user };
	}

	@Mutation(() => Boolean)
	async logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
		return new Promise<boolean>((resolve) =>
			req.session.destroy((error) => {
				res.clearCookie(COOKIE_NAME);
				if (error) {
					console.error('logout:', error);
					resolve(false);
				} else resolve(true);
			})
		);
	}
}

export default UserResolver;
