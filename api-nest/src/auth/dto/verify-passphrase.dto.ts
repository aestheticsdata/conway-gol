import { IsString } from "class-validator";

export class VerifyPassphraseDto {
  @IsString()
  username: string;

  @IsString()
  recoveryPassphrase: string;
}
