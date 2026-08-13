import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class PingQueryDto {
  @ApiProperty({ example: 'hello', description: 'Tin nhắn ping' })
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
  @ApiOperation({ summary: 'Test route cho Cache Service' })
  @ApiResponse({ status: 200, description: 'Trả về dữ liệu đã cache' })
  async testCache(): Promise<{ success: boolean; cached: string }> {
    const data = await this.cache.getOrSet(
      'test:health:random',
      async () => {
        return `random-${Math.random()}`;
      },
      10,
    );
    return { success: true, cached: data };
  }

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái hệ thống' })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  getHealth(): { success: boolean; data: { status: string; timestamp: string } } {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('ping')
  @ApiOperation({ summary: 'Test endpoint cho ValidationPipe' })
  @ApiResponse({ status: 200, description: 'Xác thực dữ liệu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  ping(@Body() body: PingQueryDto): { success: boolean; data: PingQueryDto } {
    return {
      success: true,
      data: body,
    };
  }
}
