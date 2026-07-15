import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Public } from '../../common/decorators/roles.decorator';

@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) {}

  @Public()
  @Get()
  findAll() {
    return this.plans.findAll();
  }
}
