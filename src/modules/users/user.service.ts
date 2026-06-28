import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/DB/models/user.model';
import UserRepository from 'src/DB/repository/user.repository';
import { confirmEmailDTO, createUserDTO, forgetPasswordDTO, resendOtpDTO, resetPasswordDTO, signInDTO } from './dto/user.dto';
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
import S3Service from 'src/common/service/S3.service';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
    private readonly S3Service: S3Service
  ) {}

    sendEmailOtp = async ({
    email,
    subject,
  }: {
    email: string;
    subject: EmailEnum;
  }) => {
    const isBlocked = (await this.redisService.ttl(
      this.redisService.block_otp_key(email),
    )) as number;
    if (isBlocked > 0) {
      throw new BadRequestException(
        `You are blocked yet, Try again after ${isBlocked} seconds 🔴`,
      );
    }

    const otpTTL = (await this.redisService.ttl(
      this.redisService.otp_key({ email, subject }),
    )) as number;
    if (otpTTL > 0) {
      throw new BadRequestException(
        `We can resend OTP again after ${otpTTL} seconds`,
      );
    }

    const maxOTP = await this.redisService.get(this.redisService.max_otp_key(email));
    if (maxOTP >= 3) {
      await this.redisService.setValue({
        key: this.redisService.block_otp_key(email),
        value: "1",
        ttl: 60,
      });
      await this.redisService.deleteKey(this.redisService.max_otp_key(email));
      throw new BadRequestException(
        `You have exceeded the maximum number of tries 🔴`,
      );
    }

    const otp = await generateOtp();

    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Welcome to Social App🤩",
        html: emailTemplate(otp),
      });
      await this.redisService.setValue({
        key: this.redisService.otp_key({ email, subject }),
        value: Hash({ plain_text: `${otp}` }),
        ttl: 60 * 2,
      });

      await this.redisService.incr(this.redisService.max_otp_key(email));
    });
  };

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

    const user = await this.userRepository.create({
      userName,
      email,
      age,
      password,
      phone: Encrypt(phone),
    });

    return user;
  }

  async confirmEmail(body: confirmEmailDTO) {
    const {email, code} = body
    const otpValue = await this.redisService.get(this.redisService.otp_key({email}))
    if(!otpValue) {
      throw new NotFoundException("OTP not found or expired 🔴")
    }
    if(!Compare({plain_text: code, cipher_text: otpValue})) {
      throw new BadRequestException("Invalid OTP ❎")
    }

       const user = await this.userRepository.findOneAndUpdate({
      filter: {
        email,
        confirmed: {$exists: false}
      },
      update: {
        confirmed: true
      }
    })

     if(!user) {
      throw new BadRequestException("User not found or already confirmed ❎")
    }

    await this.redisService.deleteKey(this.redisService.otp_key({email,subject:EmailEnum.confirmEmail}))

    return {message: "Email confirmed successfully ✅"}


  }

  async resendOtp(body: resendOtpDTO)  {
    const { email } = body
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmed: { $exists: false },
      },
    });
    if (!user) {
      throw new BadRequestException("User not exist or already confirmed ❎");
    }
    await this.sendEmailOtp({ email, subject: EmailEnum.confirmEmail });

    return {message: "Done ✅"}
  };

  async signIn(body: signInDTO) {
    const { email, password }: signInDTO = body;

    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmed: {$exists: true}
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

  async forgetPassword(body: forgetPasswordDTO){
    const { email } = body
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmed: { $exists: true },
      },
    });
    if (!user) {
      throw new BadRequestException("User not exist or account not confirmed ❎");
    }

    await this.sendEmailOtp({ email, subject: EmailEnum.forgetPassword });

    return {message:"Done ✅"}
  };

  async resetPassword(body: resetPasswordDTO) {
    const { email, code, password } = body

    const otpValue = await this.redisService.get(
      this.redisService.otp_key({ email, subject: EmailEnum.forgetPassword }),
    );
    if (!otpValue) {
      throw new Error("OTP expired 🔴");
    }
    if (!Compare({ plain_text: code, cipher_text: otpValue })) {
      throw new Error("Invalid OTP ❎", { cause: 400 });
    }

    const user = await this.userRepository.findOneAndUpdate({
      filter: {
        email,
        confirmed: { $exists: true },
      },
      update: {
        password: Hash({ plain_text: password }),
        changeCredential: new Date(),
      },
    });

    if (!user) {
      throw new Error("User not exist or not confirmed");
    }

    await this.redisService.deleteKey(
      this.redisService.otp_key({ email, subject: EmailEnum.forgetPassword }),
    );

    return {message: "Done ✅"}
  };

  async logOut(query: any, req: any) {
    const { flag } = query;
    if (flag == "all") {
      req.user.changeCredential = new Date();
      await req.user.save();
    } else {
      await this.redisService.setValue({
        key: this.redisService.revoked_key({
          userId: req.user._id,
          jti: req.decoded.jti!,
        }),
        value: req.decoded.jti!,
        ttl: req.decoded.exp! - Math.floor(Date.now() / 1000),
      });
    }

    return {message: "Done"}
  };

  async uploadProfileImage(file: Express.Multer.File) {
    return this.S3Service.uploadFile({
      file: file,
      path: "users"
    })
  }
}
