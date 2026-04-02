import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, MinLength } from "class-validator";

export class PatternBatchBodyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(48)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(191, { each: true })
  public names!: string[];
}
