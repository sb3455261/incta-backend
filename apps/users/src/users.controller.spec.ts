import { Test, TestingModule } from '@nestjs/testing';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getHello: jest.fn(),
          },
        },
        {
          provide: createMockAppConfig,
          useFactory: () => ({
            ...createMockAppConfig(),
          }),
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('getHello', () => {
    it('should return the result from UsersService.getHello', async () => {
      const expectedResult = 'Hello World!';
      jest.spyOn(usersService, 'getHello').mockResolvedValue(expectedResult);

      const result = await usersController.getHello();

      expect(result).toBe(expectedResult);
      expect(usersService.getHello).toHaveBeenCalled();
    });
  });
});
