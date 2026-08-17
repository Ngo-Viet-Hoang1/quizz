import { Controller, Get, Post, Body, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class PingQueryDto {
  @ApiProperty({ example: 'hello', description: 'Ping message payload' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  repeat?: number;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(CACHE_SERVICE) private readonly cache: ICacheService) {}

  @Get('cache-test')
  @ApiOperation({ summary: 'Test route for Cache Service' })
  @ApiResponse({ status: 200, description: 'Returns cached data' })
  async testCache(): Promise<{ cached: string }> {
    const data = await this.cache.getOrSet(
      'test:health:random',
      async () => {
        return `random-${Math.random()}`;
      },
      10,
    );
    return { cached: data };
  }

  @Get()
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('ping')
  @ApiOperation({ summary: 'Test endpoint for ValidationPipe' })
  @ApiResponse({ status: 200, description: 'Validation succeeded' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  ping(@Body() body: PingQueryDto): PingQueryDto {
    return body;
  }

  // TODO: remove or guard before production
  @Get('error-test')
  @ApiExcludeEndpoint()
  testError(): void {
    throw new NotFoundException('quiz not found');
  }

  // TODO: remove or guard before production
  @Get('generic-error-test')
  @ApiExcludeEndpoint()
  testGenericError(): void {
    throw new Error('sensitive db error info');
  }
}
