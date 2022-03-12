import { Field, ObjectType } from 'type-graphql';
import { Column, Entity } from 'typeorm';

@ObjectType()
@Entity()
class Image {
	@Field()
	@Column({ default: false })
	hasImage!: boolean;

	@Field({ nullable: true })
	@Column({ nullable: true })
	imagePath: string;
}

export default Image;
