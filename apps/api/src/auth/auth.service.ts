import {BadRequestException, Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {SystemsDatabaseService, TokenType} from "@thinkbloom/data-sources";
import {HashingProvider} from "../common/providers/hashing.provider";
import {ForgotPasswordDto, SetNewPasswordDto, UserLoginDto, VerifyTokenDto} from "@/auth/dto/auth.dto";
import {JwtService} from "@nestjs/jwt";
import {getCurrentUnixTimestamp, getTimestamps, getUnixTimestampPlusDays} from "utils/src/date-formatter.service";
import {randomUUID} from "crypto";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private systemDbService:SystemsDatabaseService,
    private hashingProvider:HashingProvider,
    private jwtService:JwtService,
    private eventEmitter:EventEmitter2
  ) {}

  // =================== USER LOGIN ===================

  async login(dto:UserLoginDto){
    const user = await this.systemDbService.user.findUnique({
      where:{
        email:dto.email
      }
    })

    if(!user || !user.password){
      this.logger.error("User does not exist");
      throw new UnauthorizedException("User not found");
    }

    const isPasswordValid = await this.hashingProvider.verify(dto.password,user.password!)

    if(!isPasswordValid){
      this.logger.error("Invalid password");
      throw new UnauthorizedException("Invalid password");
    }

    return this.buildAuthResponse(user)

  }

  // =================== VALIDATE  TOKEN ===================

  async validateToken(dto:VerifyTokenDto,verifyToken:string){

    const hashedToken = await this.hashingProvider.hashToken(verifyToken)
    this.logger.log(
      `Validating invite for ${dto.email} with hashedToken: ${hashedToken}`,
    );

    const token= await this.systemDbService.userToken.findFirst({
      where:{
        token_hash:hashedToken,
        used_at:null,
        expires_at: {gt:getCurrentUnixTimestamp()},
        type:dto.type,
        user:{email:dto.email}
      },
      include:{ user: true },
      orderBy:{created_at:'desc'}
    })

    if(!token){
      this.logger.error("Invalid or expired token");
      throw new BadRequestException("Invalid or expired token");
    }

    return {
      valid:true,
      email:token.user.email,
      firstName:token.user.first_name,
    }
  }

  // =================== SET PASSWORD VIA TOKEN ===================

  async setNewPassword(dto:SetNewPasswordDto,token:string){
    const hashedPassword = await this.hashingProvider.hash(dto.password);
    const hashedToken = await this.hashingProvider.hashToken(token)
    this.logger.log(
      `Setting new password for ${dto.email} with hashedToken: ${hashedToken}`,
    );

    const verifiedToken= await this.systemDbService.userToken.findFirst({
      where:{
        token_hash:hashedToken,
        used_at:null,
        expires_at: {gt:getCurrentUnixTimestamp()},
        user:{email:dto.email}
      },
      include:{ user: true },
      orderBy:{created_at:'desc'}
    })

    if(!verifiedToken){
      this.logger.error("Invalid or expired token");
      throw new BadRequestException("Invalid or expired token");
    }

    await this.systemDbService.$transaction([
      this.systemDbService.user.update({
        where:{
          id:verifiedToken.user_id
        },
        data:{
          password:hashedPassword,
          ...getTimestamps("update")
        }
      }),
      this.systemDbService.userToken.update({
        where:{
          id:verifiedToken.id,type:verifiedToken.type
        },
        data:{
          used_at:getCurrentUnixTimestamp()
        }
      })
    ])

    return {success:true};


  }


  //=================== FORGOT PASSWORD ===================

  async forgotPassword(dto:ForgotPasswordDto){
    const user = await this.systemDbService.user.findUnique({
      where:{
        email:dto.email
      }
    })

    if(!user){
      this.logger.error("User does not exist");
      throw new UnauthorizedException("User not found");
    }

    const plainToken = randomUUID()
    const hashedToken = await this.hashingProvider.hashToken(plainToken);

    const userTokenPayload = {
      user_id: user.id,
      token_hash: hashedToken,
      type: TokenType.PASSWORD_RESET,
      expires_at: getUnixTimestampPlusDays(300), // token vaild for 5 minutes
      ...getTimestamps("create")
    };

    await this.systemDbService.userToken.create({
      data:{...userTokenPayload}
    })

    //TODO: Send email to user with the plainToken
    const userEventData = {
      userId: user.id,
      name: user.first_name,
      email: user.email,
      token: plainToken,
      type: TokenType.PASSWORD_RESET
    }
this.logger.log("invoking user.password.reset event with data:",userEventData)
    this.eventEmitter.emit("user.password.reset",userEventData)



  }

  // ================ BUILD AUTH RESPONSE ==================

  private buildAuthResponse(user:any){

    const accessToken = this.jwtService.sign({
      sub:user.id,
      email:user.email,
      role:user.role,
    })

    return{
      accessToken,
      user:{
        uuid: user.uuid,
        firstName:user.first_name,
        lastName:user.last_name,
        email:user.email,
        role:user.role,
      }
    }
  }

  async validateJwtPayload(payload: any) {
    this.logger.debug(
      `validateJwtPayload called with payload: ${JSON.stringify(payload)}`,
    );

    const user = await this.systemDbService.user.findUnique({
      where: { id: payload.sub, email: payload.email },
    });

    if (!user) {
      this.logger.log("User not found");
      throw new UnauthorizedException("Invalid token");
    }

    this.logger.debug(
      `token validated for user: ${JSON.stringify(user.email)}`,
    );
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
