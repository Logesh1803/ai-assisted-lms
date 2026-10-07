import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { HashingProvider } from "@/common/providers/hashing.provider";
import { UserListener } from "@/user/listener/user.listener";

@Module({
  controllers: [UserController],
  providers: [UserService, HashingProvider, UserListener],
  exports: [UserService],
})
export class UserModule {}
