import {Body, Controller, Param, Post} from '@nestjs/common';
import {AuthService} from "@/auth/auth.service";
import {ApiSwaggerEndpoint, Public} from "@/common/decorators";
import {UserService} from "@/user/user.service";
import {CreateUserDto} from "@/user/dto/create-user.dto";
import {ApiTags} from "@nestjs/swagger";
import {ForgotPasswordDto, SetNewPasswordDto, UserLoginDto, VerifyTokenDto} from "@/auth/dto/auth.dto";

@Public()
@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private authService:AuthService,private userService:UserService) {
  }
  // =================== USER REGISTRATION ===================
  @ApiSwaggerEndpoint({
    summary:"Register a new user",
    description:"Endpoint to register a new user in the system",
    bodyDto:CreateUserDto,
    successDescription:"Returns the newly created user object upon successful registration",
  })
  @Post("register")
  async registerUser(@Body() dto:CreateUserDto){
    return await this.userService.createUser(dto)
  }

  // =================== USER LOGIN ===================
  @ApiSwaggerEndpoint({
    summary:"User login",
    description:"Authenticate user with email and password against the system database",
    bodyDto:UserLoginDto,
    successDescription:"Returns auth response with JWT token and user details upon successful login",
  })
  @Post("login")
  async loginUser(@Body() dto:UserLoginDto){
    return await this.authService.login(dto)
  }

  // ================= VALIDATE TOKEN =================

  @ApiSwaggerEndpoint({
    summary:"Validate auth token",
    description:"Validates the provided authentication token",
    bodyDto:VerifyTokenDto,
    params:[
      {name:"token",required:true}
    ],
    successDescription:"Returns validation result of the auth token",
  })
  @Post("verify/:token")
  async validateAuthToken(@Body() dto:VerifyTokenDto,@Param("token") token:string){
    return await this.authService.validateToken(dto,token)
  }

  // ================= FORGOT PASSWORD =================
  @ApiSwaggerEndpoint({
    summary:"Initiate forgot password",
    description:"Sends a password reset link to the user's email",
    bodyDto:ForgotPasswordDto,
    successDescription:"Indicates that the password reset link has been sent",
  })
  @Post("forgot-password")
  async forgotPassword(@Body() dto:ForgotPasswordDto){
    return await this.authService.forgotPassword(dto)
  }

  // ================= RESET PASSWORD =================
  @ApiSwaggerEndpoint({
    summary:"Reset user password",
    description:"Resets the user's password using a valid reset token",
    bodyDto:SetNewPasswordDto,
    params:[
      {name:"token",required:true}
    ],
    successDescription:"Indicates that the password has been successfully reset",
  })
  @Post("reset-password")
  async resetPassword(@Body() dto:SetNewPasswordDto,@Param("token") token:string){
    return await this.authService.setNewPassword(dto,token)
  }



}
