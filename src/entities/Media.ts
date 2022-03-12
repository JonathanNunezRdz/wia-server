import { Field, ObjectType } from 'type-graphql';
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { MediaType } from '../utils/types';
import Image from './Image';
import KnownMedia from './KnownMedia';

@ObjectType()
@Entity()
class Media extends BaseEntity {
	@Field()
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column({ unique: true })
	title!: string;

	@Field(() => MediaType)
	@Column({ type: 'enum', enum: MediaType, default: MediaType.ANIME })
	type: MediaType;

	@Field(() => Image)
	@Column(() => Image)
	image: Image;

	@Field(() => [KnownMedia])
	@OneToMany(() => KnownMedia, (knownMedia) => knownMedia.media, {
		cascade: true,
	})
	knownMedias: KnownMedia[];

	@Field(() => Date)
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;

	@Field(() => Date)
	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date;
}

export default Media;
