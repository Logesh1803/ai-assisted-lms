import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
