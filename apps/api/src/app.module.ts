import { Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { ApplicationsController } from './applications/applications.controller.js';
import { ApplicationsService } from './applications/applications.service.js';
import { DATABASE, createPool, databaseUrl } from './database.js';
import { PagesController } from './pages/pages.controller.js';
import { PagesService } from './pages/pages.service.js';
import { RateLimiter } from './rate-limit.js';
import type { Sql } from './sql.js';

@Module({
  controllers: [PagesController, ApplicationsController],
  providers: [
    PagesService,
    ApplicationsService,
    RateLimiter,
    {
      provide: DATABASE,
      useFactory: () => createPool(databaseUrl()),
    },
  ],
})
export class AppModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE) private readonly db: Sql) {}

  async onModuleDestroy(): Promise<void> {
    if ('end' in this.db && typeof this.db.end === 'function') {
      await this.db.end();
    }
  }
}
