import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: "Username may only contain letters, digits, _ or -" })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  recoveryPassphrase: string;
}
