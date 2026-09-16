import { ApiProperty } from '@nestjs/swagger';

export class TokenPairResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;
}

export class AccessTokenResponseDto {
  @ApiProperty()
  access_token: string;
}
