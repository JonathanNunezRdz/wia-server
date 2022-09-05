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
import Image from './Image';
import KnownMedia from './KnownMedia';

@ObjectType()
@Entity()
class User extends BaseEntity {
	@Field()
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column()
	firstName!: string;

	@Field()
	@Column()
	lastName!: string;

	@Field()
	@Column({ unique: true })
	email!: string;

	@Column()
	password!: string;

	@Field()
	@Column({ unique: true })
	username!: string;

	@Field(() => Image)
	@Column(() => Image)
	image: Image;

	@Field(() => [KnownMedia])
	@OneToMany(() => KnownMedia, (knownMedia) => knownMedia.user)
	knownMedias: KnownMedia[];

	@Field(() => Date)
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;

	@Field(() => Date)
	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date;
}

export default User;
