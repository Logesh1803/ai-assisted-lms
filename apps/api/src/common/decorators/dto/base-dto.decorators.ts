import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsBoolean,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  IsStrongPassword, IsInt, IsNumber, Min, Max,
} from 'class-validator';


export function TokenField(example = 'dc1322c84a69636731a3d8ad5ce37d37') {
  return applyDecorators(
    ApiProperty({ example }),
    IsString(),
    IsNotEmpty(),
  );
}

export function UserNameField(example = 'John', max = 25, type = 'First Name', requiredField = true) {
  const decorators = [
    ApiProperty({
      example,
      required: requiredField,
    }),
    IsString({ message: `${type} must be a valid string.` }),
    MaxLength(max, {
      message: `${type} cannot exceed ${max} characters.`,
    }),
  ];

  if (!requiredField) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function StatusField () {
  return applyDecorators(
    ApiProperty({example: true}),
    IsBoolean(),
  );
}

export function EmailField (){
  return applyDecorators(
    ApiProperty({ example: 'example@gmail.com' }),
    IsEmail());
}

export function PasswordField (isStrongPassword=false) {
  const decorators = [
    ApiProperty({ example: 'Password@123' }),
    IsString(),
    IsNotEmpty()
  ]
  if(isStrongPassword){
    decorators.push(
      IsStrongPassword({
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }))
  }
  return applyDecorators(...decorators);
}

export function OtpField  (){
  return  applyDecorators(
    ApiProperty({ example: '123456' }),
    IsString(),
    Length(6, 6),
  );
}

export function PhoneField(){
  return applyDecorators(
    ApiProperty({
      example: '+447700900123',
      required: false,
      description: 'International phone number (E.164, max 15 digits)',
    }),
    IsString(),
    Matches(/^\+[1-9]\d{1,14}$/, {
      message:
        'Phone number must be in E.164 format (max 15 digits)',
    }))
}

export function AddressField(){
  return applyDecorators(
    ApiProperty({ example: "1st street, London" }),
    IsString({ message: "Address must be a valid text value." }),
    MinLength(5, { message: "Address must be at least 5 characters long." }),
    MaxLength(100, { message: "Address cannot exceed 100 characters." }),
    Matches(/^[a-zA-Z0-9\s,./-]*$/, {message:"Address can contain only letters, numbers, spaces, comma, dot, slash and hyphen." })
  );
}

export function StringField(options?: {
  example?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  description?: string;
  matches?: boolean;
}) {
  const {
    example = 'text',
    required = true,
    minLength,
    maxLength,
    description,
    matches = false,
  } = options || {};

  const decorators = [
    ApiProperty({
      example,
      required,
      description,
    }),
    IsString({ message: 'Value must be a string.' }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  if (minLength !== undefined) {
    decorators.push(
      MinLength(minLength, {
        message: `Must be at least ${minLength} characters long.`,
      }),
    );
  }

  if (maxLength !== undefined) {
    decorators.push(
      MaxLength(maxLength, {
        message: `Must not exceed ${maxLength} characters.`,
      }),
    );
  }

  if (matches) {
    decorators.push(
      Matches(/^[A-Za-z\d]+$/, {
        message:
          'Only letters and numbers are allowed (no spaces or special characters).',
      }),
    );
  }

  return applyDecorators(...decorators);
}


export function NumberField(options?: {
  example?: number;
  required?: boolean;
  min?: number;
  max?: number;
  description?: string;
  integer?: boolean;
}) {
  const {
    example = 0,
    required = true,
    min,
    max,
    description,
    integer = false,
  } = options || {};

  const decorators = [
    ApiProperty({
      example,
      required,
      description,
      type: Number,
    }),
    integer
      ? IsInt({ message: 'Value must be an integer.' })
      : IsNumber(
        {},
        { message: 'Value must be a valid number.' },
      ),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  if (min !== undefined) {
    decorators.push(
      Min(min, {
        message: `Value must be greater than or equal to ${min}.`,
      }),
    );
  }

  if (max !== undefined) {
    decorators.push(
      Max(max, {
        message: `Value must be less than or equal to ${max}.`,
      }),
    );
  }

  return applyDecorators(...decorators);
}

