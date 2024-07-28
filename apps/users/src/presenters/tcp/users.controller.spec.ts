import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import {
  EProvider,
  EUsersProviderFields,
  EUserFields,
  EDbEntityFields,
} from '@app/shared';
import { UsersController } from './users.controller';
import { UsersService } from '../../application/users.service';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';

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
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: createMockAppConfig,
          useFactory: () => createMockAppConfig(),
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return the result from UsersService.findAll', async () => {
      const expectedResult = [
        {
          [EDbEntityFields.id]: '1',
          [EUserFields.providers]: [
            {
              [EDbEntityFields.id]: '1',
              [EUsersProviderFields.userLocalId]: '1',
              [EUsersProviderFields.providerLocalId]: '1',
              [EUsersProviderFields.sub]: null,
              [EUsersProviderFields.email]: 'test@example.com',
              [EUsersProviderFields.login]: 'testuser',
              [EUsersProviderFields.name]: 'Test',
              [EUsersProviderFields.surname]: 'User',
              [EUsersProviderFields.password]: 'hashedpassword',
              [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
              [EUsersProviderFields.emailIsValidated]: false,
              [EDbEntityFields.createdAt]: new Date(),
              [EDbEntityFields.updatedAt]: new Date(),
            },
          ],
          [EDbEntityFields.createdAt]: new Date(),
          [EDbEntityFields.updatedAt]: new Date(),
        },
      ];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(expectedResult);

      const result = await usersController.findAll();

      expect(result).toEqual(expectedResult);
      expect(usersService.findAll).toHaveBeenCalled();
    });

    it('should throw RpcException when UsersService.findAll throws an error', async () => {
      const error = new Error('Test error');
      jest.spyOn(usersService, 'findAll').mockRejectedValue(error);

      await expect(usersController.findAll()).rejects.toThrow(RpcException);
    });
  });

  describe('create', () => {
    it('should call UsersService.create with correct parameters', async () => {
      const userProviderData = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'password123',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const expectedResult = { [EDbEntityFields.id]: '1' };
      jest.spyOn(usersService, 'create').mockResolvedValue(expectedResult);

      const result = await usersController.create(userProviderData);

      expect(result).toEqual(expectedResult);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.any(CreateUsersProviderCommand),
      );
    });

    it('should throw RpcException when UsersService.create throws an error', async () => {
      const userProviderData = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'password123',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const error = new Error('Test error');
      jest.spyOn(usersService, 'create').mockRejectedValue(error);

      await expect(usersController.create(userProviderData)).rejects.toThrow(
        RpcException,
      );
    });
  });
});
