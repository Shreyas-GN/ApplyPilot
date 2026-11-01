import { IsEmail, IsString, Length } from "class-validator";

// Numeric bounds mirror packages/validators/src/auth.ts's passwordSchema —
// kept in sync by hand since this DTO uses class-validator (Nest's
// ValidationPipe) while the frontend/zod side uses the shared schema.
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(10, 128)
  password!: string;
}
