import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { userModel } from 'src/DB/models/user.model';
import UserRepository from 'src/DB/repository/user.repository';
import { createClient } from 'redis';
import RedisService from 'src/common/service/redis.service';
import { RedisModule } from 'src/common/Redis/redis.module';
import TokenService from 'src/common/service/token.service';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [userModel, RedisModule],
  controllers: [UserController],
  providers: [UserService, UserRepository,RedisService,TokenService,JwtService
  ],
})
export class UserModule {}
