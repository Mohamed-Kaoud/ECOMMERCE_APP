import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/DB/models/user.model';
import UserRepository from 'src/DB/repository/user.repository';
import { createUserDTO, signInDTO } from './dto/user.dto';
import { Compare, Hash } from 'src/common/security/hash.security';
import { Encrypt } from 'src/common/security/encrypt.security';
import { generateOtp, sendEmail } from 'src/common/utils/email/send.email';
import { eventEmitter } from 'src/common/utils/email/email.events';
import { EmailEnum } from 'src/common/enum/email.enum';
import { emailTemplate } from 'src/common/utils/email/email.template';
import RedisService from 'src/common/service/redis.service';
import TokenService from 'src/common/service/token.service';
import { randomUUID } from 'crypto';
import { RoleEnum } from 'src/common/enum/user.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  async getUsers() {
    const users = await this.userRepository.find();
    if (users.length == 0) {
      throw new HttpException('No users found ❎', 404);
    }
    return users;
  }

  async signUp(body: createUserDTO) {
    const { userName, email, password, age, phone } = body;
    const userExist = await this.userRepository.findOne({
      filter: { email },
    });
    if (userExist) {
      throw new ConflictException(`User with email ${email} already exist 🔴`);
    }

    const user = await this.userRepository.create({
      userName,
      email,
      age,
      password,
      phone: Encrypt(phone),
    });

    const otp = await generateOtp();
    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: 'Email Confirmation ✅',
        html: emailTemplate(otp),
      });
      await this.redisService.setValue({
        key: this.redisService.otp_key({ email: email }),
        value: Hash({ plain_text: `${otp}` }),
        ttl: 60 * 2,
      });
      await this.redisService.setValue({
        key: this.redisService.max_otp_key(email),
        value: '1',
        ttl: 60 * 6,
      });
    });
    return user;
  }

  async signIn(body: signInDTO) {
    const { email, password }: signInDTO = body;

    const user = await this.userRepository.findOne({
      filter: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or not confirmed ❎');
    }

    if (!Compare({ plain_text: password, cipher_text: user.password })) {
      throw new BadRequestException('Invalid password ❎');
    }
    const jwtid = randomUUID();
    const access_token = await this.tokenService.GenerateToken({
      payload: { id: user._id },
      options: {
        secret:
          user.role == RoleEnum.user
            ? process.env.ACCESS_SECRET_KEY_USER
            : process.env.ACCESS_SECRET_KEY_ADMIN,
        expiresIn: '1day',
        jwtid,
      },
    });
    const refresh_token = await this.tokenService.GenerateToken({
      payload: { id: user._id },
      options: {
        secret:
          user.role == RoleEnum.user
            ? process.env.REFRESH_SECRET_KEY_USER
            : process.env.REFRESH_SECRET_KEY_ADMIN,
        expiresIn: '1day',
        jwtid,
      },
    });
    return { access_token, refresh_token };
  }
}
