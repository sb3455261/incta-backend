export enum EAuthRoutes {
  signin = 'signin',
  signup = 'signup',
  local = 'local',
  external = 'external',
  logout = 'logout',
  rotateToken = 'rotate-token',
  validateToken = 'validate-token',
  deleteAllUsersProviderSessions = 'delete-all-users-provider-sessions',
}

export enum EAuthParams {
  deviceId = 'device-id',
  accessToken = 'access-token',
  userId = 'user-id',
  provider = 'provider',
}
