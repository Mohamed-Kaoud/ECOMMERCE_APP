import { Body, Controller, Get, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { createUserDTO, signInDTO } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.getUsers()
  }

  @Post("/signup")
  signUp(@Body() body: createUserDTO) {
    return this.userService.signUp(body)
  }

    @Post("/signin")
  signIn(@Body() body: signInDTO) {
    return this.userService.signIn(body)
  }

}
