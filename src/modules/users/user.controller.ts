import { Body, Controller, Get, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { confirmEmailDTO, createUserDTO, forgetPasswordDTO, resendOtpDTO, resetPasswordDTO, signInDTO } from './dto/user.dto';
import { TokenEnum } from 'src/common/enum/token.enum';
import { RoleEnum } from 'src/common/enum/user.enum';
import { Auth } from 'src/common/decorator/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerCloud } from 'src/common/utils/multer.utils';
import { multer_enum, Store_Enum } from 'src/common/enum/multer.enum';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth({token_type: TokenEnum.access_token, access_roles: [RoleEnum.admin]})
  getUsers() {
    return this.userService.getUsers()
  }

  @Post("/signup")
  signUp(@Body() body: createUserDTO) {
    return this.userService.signUp(body)
  }

  @Patch("confirm-email")
  confirmEmail(@Body() body: confirmEmailDTO) {
    return this.userService.confirmEmail(body)
  }

  @Post("resend-otp")
  resendOtp(@Body() body: resendOtpDTO) {
    return this.userService.resendOtp(body)
  }

  @Post("/signin")
  signIn(@Body() body: signInDTO) {
    return this.userService.signIn(body)
  }

  @Patch("reset-password")
  resetPassword(@Body() body: resetPasswordDTO) {
    return this.userService.resetPassword(body)
  }

  @Post("forget-password")
  forgetPassword(@Body() body: forgetPasswordDTO) {
    return this.userService.forgetPassword(body)
  }
  @UseGuards(AuthenticationGuard)
  @Patch("logout")
  logOut(@Query() query: any, @Req() req: any) {
    return this.userService.logOut(query, req)
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("attachment",multerCloud({custom_types: multer_enum.image})))
  uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadProfileImage(file)
  }

}
