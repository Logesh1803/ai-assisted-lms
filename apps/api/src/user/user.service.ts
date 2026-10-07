import {
  ConflictException,
  Injectable,
  Logger,
  NotImplementedException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { SystemsDatabaseService } from "@thinkbloom/data-sources";

import { getTimestamps } from "@thinkbloom/utils";
import { HashingProvider } from "@/common/providers/hashing.provider";

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    private systemDbService: SystemsDatabaseService,
    private hashingProvider: HashingProvider,
  ) {}

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.systemDbService.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      this.logger.error("User already exists");
      throw new ConflictException("User with this email already exists");
    }
    const hashedPassword = await this.hashingProvider.hash(dto.password);
    const newUser = await this.systemDbService.user.create({
      data: {
        email: dto.email,
        first_name: dto.firstName,
        last_name: dto.lastName,
        password: hashedPassword,
        role: dto.role,
        ...getTimestamps("create"),
      },
    });

    if (!newUser) {
      this.logger.error("User registration failed");
      throw new ConflictException("User registration failed");
    }

    //TODO: Send verification email

    return newUser;
  }

  // The four methods below are still the generator's scaffolding. They are
  // reachable over HTTP, so they report "not implemented" rather than
  // returning a string that reads like the action succeeded.

  findAll(): never {
    throw new NotImplementedException("Listing users is not implemented yet");
  }

  findOne(_id: number): never {
    throw new NotImplementedException("Fetching a user is not implemented yet");
  }

  update(_id: number, _updateUserDto: UpdateUserDto): never {
    throw new NotImplementedException("Updating a user is not implemented yet");
  }

  remove(_id: number): never {
    throw new NotImplementedException("Deleting a user is not implemented yet");
  }
}
