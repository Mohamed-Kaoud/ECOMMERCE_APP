import { AuthenticationGuard } from "../guards/authentication.guard";
import { AuthorizationGuard } from "../guards/authorization.guard";
import { TokenEnum } from "../enum/token.enum";
import { RoleEnum } from "../enum/user.enum";
import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";

export function Auth({token_type, access_roles}: {token_type: TokenEnum, access_roles: RoleEnum[]}) {
    return applyDecorators(
        SetMetadata("tokenType", token_type),
        SetMetadata("Roles", access_roles),
        UseGuards(AuthenticationGuard, AuthorizationGuard)
    )
}