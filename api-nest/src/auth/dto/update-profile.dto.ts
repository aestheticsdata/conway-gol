import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

import { USER_AVATAR_ID_LIST } from "../../shared/user-avatar-ids";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: "Username may only contain letters, digits, _ or -" })
  username?: string;

  @IsOptional()
  @IsString()
  @IsIn(USER_AVATAR_ID_LIST)
  avatarId?: string;
}
