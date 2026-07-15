import { Module } from '@nestjs/common';
import { WorkItemController } from './work-item.controller';
import { WorkItemService } from './work-item.service';

@Module({
  controllers: [WorkItemController],
  providers: [WorkItemService],
  exports: [WorkItemService],
})
export class WorkItemModule {}
