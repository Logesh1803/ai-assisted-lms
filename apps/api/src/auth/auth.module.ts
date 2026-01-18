import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {HashingProvider} from "@/common/providers/hashing.provider";
import {UserModule} from "@/user/user.module";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports:[
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "12345",
        signOptions: {
          expiresIn: configService.get<number>("JWT_EXPIRES_IN") || "1d",
        },
      }),
    }),UserModule],
  controllers: [AuthController],
  providers: [AuthService,HashingProvider]
})
export class AuthModule {}
