import { FieldError, RegisterInput } from '../resolvers/user';
import validateEmail from './validateEmail';

const validateRegister = (options: RegisterInput): FieldError[] | null => {
	const errors: FieldError[] = [];
	if (!validateEmail(options.email))
		errors.push({
			field: 'email',
			message: 'Email not valid',
		});
	if (options.username.length <= 3)
		errors.push({
			field: 'username',
			message: 'Username length must be greater than 3',
		});
	if (options.firstName === '')
		errors.push({
			field: 'firstName',
			message: 'First name length must be greater than 0',
		});
	if (options.lastName === '')
		errors.push({
			field: 'lastName',
			message: 'Last name length must be greater than 0',
		});
	if (options.password.length <= 6)
		errors.push({
			field: 'password',
			message: 'Password length must be greater than 6',
		});
	if (errors.length > 0) return errors;
	return null;
};

export default validateRegister;
