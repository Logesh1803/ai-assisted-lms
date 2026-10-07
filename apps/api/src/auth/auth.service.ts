import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { SystemsDatabaseService, TokenType } from "@thinkbloom/data-sources";
import { HashingProvider } from "../common/providers/hashing.provider";
import { JwtPayload, RequestUser } from "@/common/types/request.types";
import {
  ForgotPasswordDto,
  SetNewPasswordDto,
  UserLoginDto,
  VerifyTokenDto,
} from "@/auth/dto/auth.dto";
import { JwtService } from "@nestjs/jwt";
import {
  getCurrentUnixTimestamp,
  getTimestamps,
  getUnixTimestampPlusDays,
} from "@thinkbloom/utils";
import { randomUUID } from "crypto";
import { EventEmitter2 } from "@nestjs/event-emitter";

// Must match the "1 day" the reset email tells the user.
const PASSWORD_RESET_TOKEN_TTL_DAYS = 1;

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private systemDbService: SystemsDatabaseService,
    private hashingProvider: HashingProvider,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── USER LOGIN ────────────────────────────────────────────────────────

  async login(dto: UserLoginDto) {
    const user = await this.systemDbService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user || !user.password) {
      this.logger.error("User does not exist");
      throw new UnauthorizedException("User not found");
    }

    const isPasswordValid = await this.hashingProvider.verify(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.error("Invalid password");
      throw new UnauthorizedException("Invalid password");
    }

    return this.buildAuthResponse(user);
  }

  // ─── VALIDATE  TOKEN ───────────────────────────────────────────────────

  async validateToken(dto: VerifyTokenDto, verifyToken: string) {
    const hashedToken = this.hashingProvider.hashToken(verifyToken);
    this.logger.log(
      `Validating invite for ${dto.email} with hashedToken: ${hashedToken}`,
    );

    const token = await this.systemDbService.userToken.findFirst({
      where: {
        token_hash: hashedToken,
        used_at: null,
        expires_at: { gt: getCurrentUnixTimestamp() },
        type: dto.type,
        user: { email: dto.email },
      },
      include: { user: true },
      orderBy: { created_at: "desc" },
    });

    if (!token) {
      this.logger.error("Invalid or expired token");
      throw new BadRequestException("Invalid or expired token");
    }

    return {
      valid: true,
      email: token.user.email,
      firstName: token.user.first_name,
    };
  }

  // ─── SET PASSWORD VIA TOKEN ────────────────────────────────────────────

  async setNewPassword(dto: SetNewPasswordDto, token: string) {
    const hashedToken = this.hashingProvider.hashToken(token);
    this.logger.log(
      `Setting new password for ${dto.email} with hashedToken: ${hashedToken}`,
    );

    const verifiedToken = await this.systemDbService.userToken.findFirst({
      where: {
        token_hash: hashedToken,
        used_at: null,
        expires_at: { gt: getCurrentUnixTimestamp() },
        user: { email: dto.email },
      },
      include: { user: true },
      orderBy: { created_at: "desc" },
    });

    if (!verifiedToken) {
      this.logger.error("Invalid or expired token");
      throw new BadRequestException("Invalid or expired token");
    }

    // Hash only after the token is valid — scrypt is slow, so hashing first
    // let any caller with a fake token make the server do that work.
    const hashedPassword = await this.hashingProvider.hash(dto.password);

    await this.systemDbService.$transaction([
      this.systemDbService.user.update({
        where: {
          id: verifiedToken.user_id,
        },
        data: {
          password: hashedPassword,
          ...getTimestamps("update"),
        },
      }),
      this.systemDbService.userToken.update({
        where: {
          id: verifiedToken.id,
          type: verifiedToken.type,
        },
        data: {
          used_at: getCurrentUnixTimestamp(),
        },
      }),
    ]);

    return { success: true };
  }

  //=================== FORGOT PASSWORD ===================

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.systemDbService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    // Answer exactly as for a real account, so this endpoint can't be used to
    // find out which emails are registered.
    if (!user) {
      this.logger.warn("Password reset requested for an unknown email");
      return;
    }

    const plainToken = randomUUID();
    const hashedToken = this.hashingProvider.hashToken(plainToken);

    const userTokenPayload = {
      user_id: user.id,
      token_hash: hashedToken,
      type: TokenType.PASSWORD_RESET,
      expires_at: getUnixTimestampPlusDays(PASSWORD_RESET_TOKEN_TTL_DAYS),
      ...getTimestamps("create"),
    };

    await this.systemDbService.userToken.create({
      data: { ...userTokenPayload },
    });

    //TODO: Send email to user with the plainToken
    const userEventData = {
      userId: user.id,
      name: user.first_name,
      email: user.email,
      token: plainToken,
      type: TokenType.PASSWORD_RESET,
    };
    // Never log `userEventData` — it holds the plain reset token.
    this.logger.log(`Emitting user.password.reset for user ${user.id}`);
    this.eventEmitter.emit("user.password.reset", userEventData);
  }

  // ─── BUILD AUTH RESPONSE ───────────────────────────────────────────────

  private buildAuthResponse(user: RequestUser) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        uuid: user.uuid,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateJwtPayload(payload: JwtPayload) {
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
