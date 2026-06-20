import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate, IsString, IsNotEmpty, IsEmail, Length, IsInt, ValidationOptions, registerDecorator, ValidateIf, IsOptional } from 'class-validator';

@ValidatorConstraint({ name: 'MatchKey', async: false })
export class MatchKey implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    return value === args.object[args.constraints[0]]
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must match the ${args.constraints[0]} 🔴`;
  }
}

export function IsMatch(constraints: string[] ,validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: MatchKey
    });
  };
}


export class createUserDTO {
  @IsString()
  @IsNotEmpty()
  @Length(2,50) 
  userName: string;
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @ValidateIf((data: createUserDTO) => {
    return Boolean(data.password)
  })
  @IsMatch(["password"])
  cPassword: string;
  @IsInt()
  @IsNotEmpty()
  age: number;

  @IsString()
  @IsOptional()
  @Length(11, 11)
  phone: string
}

export class signInDTO {

  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}
