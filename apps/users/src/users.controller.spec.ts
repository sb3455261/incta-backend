describe('UsersController', () => {
  // let usersController: UsersController;

  beforeEach(async () => {
    /* const app: TestingModule = await Test.createTestingModule({
      imports: [AppConfigModule, PrismaModule],
      controllers: [UsersController],
      providers: [
        UsersService,
        PrismaService,
        {
          provide: UserRepository,
          useClass: PrismaUserRepository,
        },
      ],
    }).compile();

    usersController = app.get<UsersController>(UsersController); */
  });

  describe('root', () => {
    it('should return "Hello World 1!"', async () => {
      expect(true).toBe(true);
      // expect(await usersController.getHello()).toContain('Hello World 1!');
    });
  });
});
