import {ConflictException, Injectable, Logger} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {SystemsDatabaseService} from "@thinkbloom/data-sources";

import {getTimestamps} from "utils/src/date-formatter.service";
import {HashingProvider} from "@/common/providers/hashing.provider";

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name)
  constructor(
    private systemDbService:SystemsDatabaseService,
    private hashingProvider:HashingProvider) {}

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.systemDbService.user.findFirst({
      where:{email:dto.email}
    })

    if(existingUser){
      this.logger.error("User already exists");
      throw  new ConflictException("User with this email already exists")
    }
    const hashedPassword = await this.hashingProvider.hash(dto.password);
    const newUser = await this.systemDbService.user.create({
      data:{
        email:dto.email,
        first_name:dto.firstName,
        last_name:dto.lastName,
        password:hashedPassword,
        role:dto.role,
        ...getTimestamps("create")
      }
    })

    if(!newUser){
      this.logger.error("User registration failed");
      throw new ConflictException("User registration failed")
    }

    //TODO: Send verification email

    return newUser;

  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
