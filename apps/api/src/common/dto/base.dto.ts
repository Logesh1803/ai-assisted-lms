import {
  AddressField,
  EmailField,
  OtpField, PasswordField,
  PhoneField, StatusField, StringField,
  TokenField,
  UserNameField
} from "../decorators";


// Base user info dto

export class UserNameDto{
  @UserNameField("John",25,"First Name",true)
  firstName:string;

  @UserNameField("Doe",25,"Last Name",false)
  lastName:string;
}

export class EmailDto {
  @EmailField()
  email:string;
}

export class PhoneDto{
  @PhoneField()
  phone:string;
}

export class AddressDto{
  @AddressField()
  address:string;
}

// Base auth dto

export class VerificationTokenDto {
  @TokenField()
  token:string;
}

export class VerificationOtpDto{
  @OtpField()
  otp:string;
}
export class PlainPasswordDto{
  @PasswordField()
  password:string;
}

export class StrongPasswordDto{
  @PasswordField(true)
  password:string;
}






