import { Global, Module } from "@nestjs/common";
import {SystemsDatabaseService} from "./system.service";

@Global()
@Module({
  imports: [],
  providers: [SystemsDatabaseService],
  exports: [SystemsDatabaseService],
})
export class SystemsDatabaseModule {
}
