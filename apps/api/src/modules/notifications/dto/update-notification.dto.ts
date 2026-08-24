import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiPropertyOptional({ description: 'Timestamp when notification was read' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readAt?: Date | null;
}
