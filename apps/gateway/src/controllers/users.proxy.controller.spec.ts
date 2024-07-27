import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError , lastValueFrom } from 'rxjs';
import { EUsersRoutes } from '@app/shared';
import { mockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersProxyController } from './users.proxy.controller';

describe('UsersProxyController', () => {
  let controller: UsersProxyController;
  let usersClient: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersProxyController],
      providers: [
        {
          provide: mockAppConfig.USERS_MICROSERVICE_NAME,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersProxyController>(UsersProxyController);
    usersClient = module.get<ClientProxy>(
      mockAppConfig.USERS_MICROSERVICE_NAME,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should call usersClient.send with correct parameters', async () => {
      const mockUsers = [{ id: '1', name: 'Test User' }];
      jest.spyOn(usersClient, 'send').mockReturnValue(of(mockUsers));

      const result = await lastValueFrom(await controller.getUsers());

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.getusers },
        {},
      );
      expect(result).toEqual(mockUsers);
    });

    it('should handle errors from usersClient', async () => {
      const error = new Error('Test error');
      jest.spyOn(usersClient, 'send').mockReturnValue(throwError(() => error));

      await expect(lastValueFrom(await controller.getUsers())).rejects.toThrow(
        'Test error',
      );
    });
  });
});
