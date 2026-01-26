import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {CourseStatus, SystemsDatabaseService} from "@thinkbloom/data-sources";
import {getCurrentUnixTimestamp, getTimestamps} from "utils/src/date-formatter.service";

@Injectable()
export class CourseService {
  constructor(private systemDbService:SystemsDatabaseService) {}

  // ============== CREATE COURSE =============
  async create(createCourseDto: CreateCourseDto,user:any) {
    const teacher = await this.systemDbService.user.findUnique({
      where:{
        uuid:createCourseDto.teacherUuid
      },
      select:{
        id:true
      }
    })

    if(!teacher){
      throw new NotFoundException("User not found");
    }

    const checkSameCourse = await this.systemDbService.course.findFirst({
      where:{
        title:createCourseDto.title,
        teacher_id:teacher.id
      }
    })

    if(checkSameCourse){
      throw  new ConflictException("This course already exists")
    }

    const newCourse = await this.systemDbService.course.create({
      data:{
        teacher_id:teacher.id,
        title:createCourseDto.title,
        description:createCourseDto.description,
        tags:createCourseDto.tags,
        status:CourseStatus.DRAFT,
        created_by:user.id,
        updated_by:user.id,
        ...getTimestamps("create")
      }
    })

    return newCourse
  }

  // ============== GET ALL COURSE ===============
  async findAll(query:any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "created_at",
      sortOrder = "desc",
    }=query

    const skip = (page - 1) * limit;

    const where:any = {}

    if(search){
      where.OR ={name:{contains:search,mode:"insensitive"}}
    }

    const totalCourses = await this.systemDbService.course.count({where})

    const courses = await this.systemDbService.course.findMany({
      where,
      skip,
      take:limit,
      orderBy:{ [sortBy] : sortOrder },
      select:{
        uuid:true,
        title:true,
        thumbnail:true,
        description:true
      }
    })

    if(!courses|| courses.length === 0){
      throw new NotFoundException("Courses not found")
    }

    const formattedCourses = courses.map(course=>({
      uuid: course.uuid,
      title:course.title,
      thumbnail:course.thumbnail,
      description:course.description,
    }))

    return{
      page,
      limit,
      totalCourses,
      formattedCourses
    }
  }

  // =============== GET SPECIFIC COURSE =============
  async findOne(courseUUid: string) {
    const course = await this.systemDbService.course.findUnique({
      where:{
        uuid:courseUUid,
      },
      select:{
        uuid:true,
        title:true,
        thumbnail:true,
        description:true,
      }
    })

    if(!course){
      throw new NotFoundException("Course not found")
    }

 return course
  }

  // ================ UPDATE COURSE ====================
  async update(courseUuid: string, updateCourseDto: UpdateCourseDto,user:any) {

    const existingCourse = await this.systemDbService.course.findUnique({
      where:{
        uuid:courseUuid
      }
    })

    if(!existingCourse){
      throw new NotFoundException("Course not found")
    }

    const updateCourse = await this.systemDbService.course.update({
      where:{
        uuid:courseUuid
      },
      data:{
        title:updateCourseDto.title,
        description:updateCourseDto.description,
        thumbnail:updateCourseDto.thumbnail,
        updated_by:user.id,
        ...getTimestamps("update")
      }
    })

    if(!updateCourse){
      throw new ConflictException("Unable to update course")
    }

    return updateCourse
  }

}
