import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/api/auth/register (POST)', () => {
    const randomSuffix = Math.floor(Math.random() * 1000000);
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: `TestUser${randomSuffix}`,
        email: `test${randomSuffix}@example.com`,
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('email');
        expect(res.body.email).toContain('@example.com');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
