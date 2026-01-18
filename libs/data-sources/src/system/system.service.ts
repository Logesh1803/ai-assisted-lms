import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../generated/system/client'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class SystemsDatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.SYSTEM_DATABASE_URL!,
    })

    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
