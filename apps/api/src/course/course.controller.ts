import { Controller, Get, Post, Body, Param,  Query, Put} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {ApiSwaggerEndpoint, AuthUser} from "@/common/decorators";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";

@ApiTags('Course')
@ApiBearerAuth()
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ====== CREATE COURSE ======
  @ApiSwaggerEndpoint({
    summary:"Create course",
    description:"Create course",
    bodyDto:CreateCourseDto
  })
  @Post()
  async create(@Body() createCourseDto: CreateCourseDto, @AuthUser()user:any) {
    return await this.courseService.create(createCourseDto,user);
  }

  // ====== GET ALL COURSE ======
  @ApiSwaggerEndpoint({
    summary:"Get all courses",
    description:"Get all courses",
    queries:[
      {name:"page",required:false},
      {name:"limit",required:false},
      {name:"search",required:false},
      {name:"sortBy",required:false},
      {name:"sortOrder",required:false}
    ]
  })
  @Get()
  async findAll(@Query()query:any) {
    return await this.courseService.findAll(query);
  }

  // ====== GET SPECIFIC COURSE ======
  @ApiSwaggerEndpoint({
    summary:"Get specific course",
    description:"Get specific course",
    params:[
      {name:"courseUuid",required:true}
    ]
  })
  @Get(':courseUuid')
  async findOne(@Param('courseUuid') id: string) {
    return await this.courseService.findOne(id);
  }

  // ======= UPDATE COURSE =========

  @ApiSwaggerEndpoint({
    summary:"Get specific course",
    description:"Get specific course",
    params:[
      {name:"courseUuid",required:true}
    ],
    bodyDto:UpdateCourseDto
  })
  @Put(':courseUuid')
  update(@Param('courseUuid') courseUuid: string, @Body() updateCourseDto: UpdateCourseDto,@AuthUser()user:any) {
    return this.courseService.update(courseUuid, updateCourseDto,user);
  }

}
