import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateWatchTimeDto {
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  watchTime: number;
}