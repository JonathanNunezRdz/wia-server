import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import Media from './Media';
import User from './User';

@ObjectType()
@Entity()
class KnownMedia extends BaseEntity {
	@Field()
	@PrimaryColumn()
	userId: number;

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.knownMedias, {
		onDelete: 'CASCADE',
	})
	user: User;

	@Field()
	@PrimaryColumn()
	mediaId: number;

	@Field(() => Media)
	@ManyToOne(() => Media, (media) => media.knownMedias, {
		cascade: true,
		onDelete: 'CASCADE',
	})
	media: Media;

	@Field(() => Date)
	@Column({ type: 'timestamptz' })
	knownAt: Date;
}

export default KnownMedia;
