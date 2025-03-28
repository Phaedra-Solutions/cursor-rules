# NestJS Enterprise Architecture Standards

This document outlines the standardized coding conventions and architectural patterns used throughout our NestJS microservices application.

## Project Structure

### Microservices Organization

```
/apps/
├── core/               # Core business logic
├── incident/           # Incident management
├── analytics/          # Analytics and reporting
├── audit/              # Audit functionality
├── workforce/          # Workforce management
├── communication/      # Communication service
├── notification/       # Notification handling
├── task/               # Task management
└── clone/              # Cloning functionality

/libs/
└── common/             # Shared code library
    ├── src/constants/  # Shared constants
    ├── src/helpers/    # Shared helpers
    ├── src/models/     # Shared data models
    ├── src/services/   # Shared services
    └── src/dto/        # Shared DTOs
```

### Feature Module Structure

Each feature module should follow this structure:

```
/modules/[feature-name]/
├── dto/                 # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── index.ts         # Barrel exports
├── helpers/             # Feature-specific helpers
│   ├── queries.helper.ts
│   ├── formatters.helper.ts
│   └── index.ts         # Barrel exports
├── [feature-name].service.ts
├── [feature-name].controller.ts
└── [feature-name].module.ts
```

## Code Organization

### Service Files

- Services should be focused on a single responsibility
- Methods should be organized by CRUD operations first, then specialized operations
- Helper functions should be extracted to separate helper files
- Service files should not exceed 500 lines; consider splitting functionality

### Service Patterns

```ts
import { Injectable } from '@nestjs/common';
import { PusherService } from '@ontrack-tech-group/common/services';

@Injectable()
export class FeatureService {
  constructor(private readonly pusherService: PusherService) {}

  async create(data: CreateEntityDto): Promise<Entity> {
      // Implementation
  }

  async findOne(id: number): Promise<Entity> {
    // Implementation
  }  

  async update(id: number, data: UpdateEntityDto): Promise<Entity> {
    // Implementation
  }

  async delete(id: number): Promise<void> {
    // Implementation
  }
}
```

### Standard Service Dependencies

```ts
@Injectable()
export class StandardService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly pusherService: PusherService,
    private readonly communicationService: CommunicationService,
    private readonly changeLogService: ChangeLogService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}
}
```

### Controller Files

- Controllers should delegate business logic to services
- Controller methods should focus on request/response handling
- Validation should be handled via DTOs with class-validator

### Standardized Controller Pattern

```ts
@ApiTags('Entity')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('entities')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Post('/')
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponse({ status: 201, type: EntityResponseDto })
  async create(
    @Body() createEntityDto: CreateEntityDto,
    @GetUser() user: User
  ): Promise<EntityResponseDto> {
    return await this.entityService.create(createEntityDto, user);
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all entities' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of entities',
    type: [EntityResponseDto] 
  })
  async findAll(@Query() query: EntityQueryParams): Promise<EntityListResponse> {
    return await this.entityService.findAll(query);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiResponse({ status: 200, type: EntityResponseDto })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EntityResponseDto> {
    return await this.entityService.findOne(id);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, type: EntityResponseDto })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntityDto: UpdateEntityDto,
    @GetUser() user: User
  ): Promise<EntityResponseDto> {
    return await this.entityService.update(id, updateEntityDto, user);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User
  ): Promise<{ message: string }> {
    await this.entityService.remove(id, user);
    return { message: 'Entity deleted successfully' };
  }
}
```

## Naming Conventions

| Item       | Convention         | Example                 |
| ---------- | ------------------ | ----------------------- |
| Files      | kebab-case         | user-profile.service.ts |
| Classes    | PascalCase         | UserProfileService      |
| Methods    | camelCase          | createUserProfile()     |
| Properties | camelCase          | userProfile             |
| Interfaces | PascalCase         | UserProfile             |
| Enums      | PascalCase         | UserRole                |
| Constants  | UPPER_SNAKE_CASE   | MAX_LOGIN_ATTEMPTS      |

### Consistent Suffixes

- **Services**: `[name].service.ts`
- **Controllers**: `[name].controller.ts`
- **Modules**: `[name].module.ts`
- **DTOs**: `[name].dto.ts`
- **Helpers**: `[name].helper.ts`

## Import Standards

```ts
// 1. NestJS framework imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 2. Third-party library imports
import { Op, Sequelize } from 'sequelize';

// 3. Shared library imports with path aliases
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { isEventExist } from '@ontrack-tech-group/common/helpers';
import { Event } from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';

// 4. Application-specific imports with path aliases
import { _ERRORS } from '@Common/constants';
import { formatDate } from '@Common/helpers';
import { EventService } from '@Modules/event/event.service';

// 5. Local imports (relative paths)
import { CreateEntityDto } from './dto';
import { getEntityById } from './helpers';
```

## Module Standards

### Module Registration

```ts
@Module({
  controllers: [FeatureController],
  providers: [
    FeatureService,
    PusherService,
    CommunicationService
  ],
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.COMMUNICATION,
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
    ConfigModule,
    HttpModule,
    forwardRef(() => DependentModule),
  ],
  exports: [FeatureService],
})
export class FeatureModule {}
```

## Dependency Injection

### Standard Injection

```ts
@Injectable()
export class CommentService {
  constructor(private readonly pusherService: PusherService) {}
}
```

### Database Model Injection

```ts
@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event) readonly event: typeof Event,
    @InjectModel(User) readonly user: typeof User,
  ) {}
}
```

### Circular Dependency Resolution

```ts
@Injectable()
export class ServiceA {
  constructor(
    @Inject(forwardRef(() => ServiceB))
    private readonly serviceB: ServiceB,
  ) {}
}
```

### Client Proxy Injection (Microservices)

```ts
export class CommunicationService {
  constructor(
    @Inject(COMMUNICATIONS_CLIENT.COMMUNICATION)
    private readonly communicationClient: ClientProxy,
  ) {}
}
```

## Error Handling

### Standard Error Pattern

```ts
@Injectable()
export class ErrorHandlingService {
  async findEntityById(id: number): Promise<Entity> {
    const entity = await Entity.findByPk(id);
    
    if (!entity) {
      throw new NotFoundException(RESPONSES.NOT_FOUND);
    }
    
    return entity;
  }
}
```

### Common Error Types

- `NotFoundException`
- `ConflictException`
- `ForbiddenException`
- `UnprocessableEntityException`

## Inter-Service Communication

```ts
export class CoreService {
  constructor(
    @Inject(COMMUNICATIONS_CLIENT.CORE)
    private readonly communicationClient: ClientProxy,
  ) {}

  public async communicate(body: {}, communicationString: string, user?: User) {
    return await sendCommunicationMessage(
      body,
      communicationString,
      this.communicationClient,
      user,
    );
  }
}
```

## Database Operations

### Transaction Pattern

```ts
@Injectable()
export class DatabaseService {
  constructor(private readonly sequelize: Sequelize) {}
  
  async createWithTransaction(data: CreateDto): Promise<Entity> {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Database operations...
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

### Transaction Provider Pattern

```ts
// providers/transaction.ts
export const TransactionProvider = {
  provide: 'SEQUELIZE',
  useFactory: async () => {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      logging: false,
    });
    return sequelize;
  },
};
```

## Real-time Updates

### Pusher Service Pattern

```ts
@Injectable()
export class EntityService {
  constructor(private readonly pusherService: PusherService) {}
  
  async update(id: number, data: UpdateDto): Promise<Entity> {
    // Update logic
    await this.pusherService.trigger(
      PusherChannels.ENTITY_CHANNEL,
      PusherEvents.ENTITY_UPDATED,
      {
        id,
        data,
        timestamp: new Date().toISOString()
      }
    );
    return entity;
  }
}
```

### PusherChannels and Events Constants

```ts
// @ontrack-tech-group/common/constants
export enum PusherChannels {
  EVENT_CHANNEL = 'event-channel',
  USER_CHANNEL = 'user-channel',
  ENTITY_CHANNEL = 'entity-channel',
}

export enum PusherEvents {
  EVENT_CREATED = 'event-created',
  EVENT_UPDATED = 'event-updated',
  ENTITY_UPDATED = 'entity-updated',
}
```

## DTOs and Validation

```ts
import { IsString, Length, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEntityDto {
  @IsString()
  @Length(2, 50)
  name: string;
  
  @IsOptional()
  @IsString()
  description: string;
  
  @IsNumber()
  @Type(() => Number)
  category_id: number;
}
```

### DTO Barrel Exports

```ts
export * from './create-entity.dto';
export * from './update-entity.dto';
export * from './query-params.dto';
```

## Helpers and Utilities

```ts
export const getEntityWhereQuery = (
  filters: EntityQueryParams,
): WhereOptions => {
  const where: WhereOptions = {};

  if (filters.name) {
    where.name = { [Op.iLike]: `%${filters.name}%` };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
};
```

### Helper Barrel Exports

```ts
export * from './entity-queries.helper';
export * from './entity-formatters.helper';
```

### Helper Organization

Helpers should be categorized into logical groups:

1. Query Helpers: Functions that construct database queries
   ```ts
   export const getIncidentDivisionWhereQuery = (filters) => {...};
   ```
2. Formatter Helpers: Functions that format data for responses
   ```ts
   export const getFormattedEventDataForCsv = (data) => {...};
   ```
3. Validation Helpers: Functions that validate data
    ```ts
    export const checkIfAllDivisionsExist = async (divisionIds) => {...};
   ```
4. Utility Helpers: General utility functions
   ```ts
   export const calculatePagination = (page, pageSize, total) => {...};
   ```


## Queue Processing

### Queue Module Configuration

```ts
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'events-queue',
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
      },
    }),
    SequelizeModule.forFeature([
      // Queue-related models
    ]),
  ],
  providers: [
    QueueService,
    QueueProcessor,
    // Dependencies needed for queue processing
    EventService,
    PusherService,
    CoreService,
  ],
  exports: [QueueService],
})
export class BullQueueModule {}
```

### Queue Processor Implementation

```ts
@Processor('events-queue')
export class QueueProcessor {
  constructor(
    private readonly eventService: EventService,
    private readonly pusherService: PusherService,
  ) {}

  @Process('process-event')
  async processEvent(job: Job<any>) {
    try {
      // Process the job
      await this.eventService.processEvent(job.data);
      return { success: true };
    } catch (error) {
      // Handle and log error
      return { success: false, error: error.message };
    }
  }
}
```

### Queue Service Implementation

```ts
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('events-queue') private readonly eventsQueue: Queue,
  ) {}

  async addEventProcessingJob(data: any) {
    return this.eventsQueue.add('process-event', data, {
      attempts: 3,
      backoff: 5000,
    });
  }
}
```

## Path Aliases

### Path Alias Configuration in tsconfig.json

```ts
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@Modules/*": ["src/modules/*"],
      "@Common/*": ["src/common/*"],
      "@ontrack-tech-group/common/*": ["../../libs/common/src/*"]
    }
  }
}
```
### Path Alias Usage

```ts
// Bad - avoid relative imports for distant modules
import { EventService } from '../../../../modules/event/event.service';

// Good - use path aliases
import { EventService } from '@Modules/event/event.service';
import { formatDate } from '@Common/helpers';
import { ERRORS } from '@ontrack-tech-group/common/constants';
```

## Security Practices

### User Authentication and Authorization

```ts
// Guard for role-based access
@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return this.hasPermission(user, requiredRoles);
  }

  private hasPermission(user: User, roles: string[]): boolean {
    // Permission checking logic
  }
}
```

### Decorator-based Permission Check

```ts
// Controller usage
@Post()
@Roles(RolesEnum.ADMIN, RolesEnum.MANAGER)
@UseGuards(RolePermissionGuard)
async create(@Body() createDto: CreateDto): Promise<Entity> {
  // Only accessible by admin and manager roles
}
```

## Summary

Following these conventions ensures consistency across our microservices architecture and makes the codebase more maintainable and readable. This document should serve as the primary reference for all developers working on the NestJS microservices application.
