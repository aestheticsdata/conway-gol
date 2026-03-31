import { IsString, MaxLength, MinLength } from "class-validator";

export class CatalogPatternNameParamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  public name!: string;
}
