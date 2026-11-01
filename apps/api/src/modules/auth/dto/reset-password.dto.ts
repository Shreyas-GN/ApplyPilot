import { IsString, Length, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @Length(10, 128)
  password!: string;
}
