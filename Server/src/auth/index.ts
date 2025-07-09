// Main module export
export { AuthModule } from './auth.module';

// Service exports
export { AuthService } from './services/auth.service';
export { PasswordService } from './services/password.service';
export { TokenService } from './services/token.service';

// Controller exports
export { AuthController } from './controllers/auth.controller';

// Guard exports
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';

// Strategy exports
export { JwtStrategy } from './strategies/jwt.strategy';
export { LocalStrategy } from './strategies/local.strategy';

// Decorator exports
export { 
  Public, 
  Roles, 
  CurrentUser, 
  UserId, 
  AdminOnly, 
  CustomerOnly 
} from './decorators/auth.decorators';

// DTO exports
export { 
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto
} from './dto/auth.dto';

// Schema exports
export { User, UserDocument, UserSchema } from './schemas/user.schema';

// Enum exports
export { UserRole } from './enums/user-role.enum';

// Interface exports
export {
  IUser,
  IAuthResponse,
  IJwtPayload,
  IPasswordHash,
  IAuthResult,
  ITokenPair,
  IAuthService,
  IPasswordService,
  ITokenService
} from './interfaces/auth.interface'; 