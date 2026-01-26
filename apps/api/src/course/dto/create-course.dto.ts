import {StringField} from "@/common/decorators";
import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsOptional, IsString} from "class-validator";

export class CreateCourseDto {
  @StringField({ example: 'abc-course', required: true })
  title: string;

  @StringField({ example: 'user-uuid-123', required: true })
  teacherUuid: string;

  @StringField({ example: 'example description', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['JavaScript', 'React'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @StringField({ example: 'https://example.com/image1' })
  thumbnail:string
}
