import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError, lastValueFrom } from 'rxjs';
import {
  EUsersRoutes,
  EProvider,
  EUsersProviderFields,
  UsersProviderDto,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersProxyController } from './users.proxy.controller';

describe('UsersProxyController', () => {
  let controller: UsersProxyController;
  let usersClient: ClientProxy;

  beforeEach(async () => {
    const mockConfig = createMockAppConfig();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersProxyController],
      providers: [
        {
          provide: mockConfig.USERS_MICROSERVICE_NAME,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersProxyController>(UsersProxyController);
    usersClient = module.get<ClientProxy>(mockConfig.USERS_MICROSERVICE_NAME);
  });

  describe('findAllUsers', () => {
    it('should call usersClient.send with correct parameters', async () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      jest.spyOn(usersClient, 'send').mockReturnValue(of(mockUsers));

      const result = await lastValueFrom(await controller.findAllUsers());

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.findAllUsers },
        {},
      );
      expect(result).toEqual(mockUsers);
    });

    it('should handle errors from usersClient', async () => {
      const error = new Error('Test error');
      jest.spyOn(usersClient, 'send').mockReturnValue(throwError(() => error));

      await expect(
        lastValueFrom(await controller.findAllUsers()),
      ).rejects.toThrow('Test error');
    });
  });

  describe('createUser', () => {
    it('should call usersClient.send with correct parameters', async () => {
      const userProviderDto: UsersProviderDto = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const mockCreatedUser = { id: '1' };
      jest.spyOn(usersClient, 'send').mockReturnValue(of(mockCreatedUser));

      const result = await lastValueFrom(
        await controller.createUser(userProviderDto),
      );

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.createUser },
        userProviderDto,
      );
      expect(result).toEqual(mockCreatedUser);
    });

    it('should handle errors from usersClient when creating user', async () => {
      const userProviderDto: UsersProviderDto = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const error = new Error('Test error');
      jest.spyOn(usersClient, 'send').mockReturnValue(throwError(() => error));

      await expect(
        lastValueFrom(await controller.createUser(userProviderDto)),
      ).rejects.toThrow('Test error');
    });
  });
});
