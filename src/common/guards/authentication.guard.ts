import { Injectable, CanActivate, ExecutionContext, BadRequestException, HttpException } from '@nestjs/common';
import TokenService from '../service/token.service';
import { Reflector } from '@nestjs/core';
import { TokenEnum } from '../enum/token.enum';


@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(
        private readonly tokenService: TokenService,
        private reflector: Reflector
    ){}
  async canActivate(context: ExecutionContext): Promise<boolean>  {

    
    const tokenType = this.reflector.get("tokenType", context.getHandler())    


    let req: any;
    let authorization: string = ""
     if(context.getType() == "http") {
        req = context.switchToHttp().getRequest()
        authorization = req.headers.authorization
     }
     else if(context.getType() == "rpc") {
        // req = context.switchToRpc().getContext()
     }
     else if(context.getType() == "ws") {
        // req = context.switchToWs().getData()
     }

     if(!authorization) {
        throw new BadRequestException("Token is required 🔴")
     }

     const [prefix, token] = authorization.split(" ")
     if(!prefix || !token) {
        throw new BadRequestException("Token or prefix not found ❎")
     }

     const {ACCESS_SECRET_KEY, REFRESH_SECRET_KEY} = await this.tokenService.getSignature(prefix)
     const secret = tokenType == TokenEnum.access_token ? ACCESS_SECRET_KEY : REFRESH_SECRET_KEY

     try {
        var {decoded,user} = await this.tokenService.decodeToken_and_fetchUser(token,secret)
     } catch (error) {
        throw new HttpException({error},400)
     }

     req.user = user
     req.decoded = decoded

    return true
  }
}
