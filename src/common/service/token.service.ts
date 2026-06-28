import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import UserRepository from 'src/DB/repository/user.repository';
import RedisService from './redis.service';

@Injectable()
class TokenService {
  constructor(
    private jwtService: JwtService,
    private userRepo: UserRepository,
    private redisService: RedisService,
  ) {}

  GenerateToken = ({
    payload,
    options,
  }: {
    payload: object;
    options?: JwtSignOptions;
  }): Promise<string> => {
    return this.jwtService.signAsync(payload, options);
  };

  VerifyToken = ({
    token,
    options,
  }: {
    token: string;
    options?: JwtVerifyOptions;
  }): Promise<JwtPayload> => {
    return this.jwtService.verifyAsync(token, options);
  };

  getSignature = async (prefix: string) => {
    let ACCESS_SECRET_KEY = '';
    let REFRESH_SECRET_KEY = '';

    if (prefix == process.env.USER_PREFIX) {
      ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY_USER!;
      REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY_USER!;
    } else if (prefix == process.env.ADMIN_PREFIX) {
      ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY_ADMIN!;
      REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY_ADMIN!;
    } else {
      throw new BadRequestException('Invalid prefix ❎');
    }

    return { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY };
  };

  decodeToken_and_fetchUser = async (token: string, secret: string) => {
    const decoded = await this.VerifyToken({
      token,
      options: { secret },
    }) as any;
    if (!decoded?.id) {
      throw new BadRequestException('Invalid token payload');
    }
    const user = await this.userRepo.findById(new Types.ObjectId(decoded.id));
    if (!user) {
      throw new NotFoundException('User not found ❎');
    }

    const revokeToken = await this.redisService.get(
      this.redisService.revoked_key({ userId: decoded.id, jti: decoded.jti! }),
    );
    if (revokeToken) {
      throw new BadRequestException('Token revoked 🔴');
    }

    return { user, decoded };
  };
}

export default TokenService;
