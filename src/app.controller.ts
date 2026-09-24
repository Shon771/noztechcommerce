import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      name: 'NozTech Commerce',
      service: 'API Server',
      status: 'online',
    };
  }
}