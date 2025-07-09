import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
// Note: mongoose-lean-virtuals plugin removed due to TypeScript compatibility issues
// Lean queries with virtuals can be achieved using .lean({ virtuals: true }) directly

export type UserDocument = User & Document;

// Address subdocument schema for embedded approach
@Schema({ _id: false, timestamps: false })
export class Address {
  @Prop({ required: true, trim: true, maxlength: 100 })
  street: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  city: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  state: string;

  @Prop({ required: true, trim: true, maxlength: 10 })
  zipCode: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  country: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ enum: ['home', 'work', 'billing', 'shipping'], default: 'home' })
  type: string;
}

// User preferences subdocument
@Schema({ _id: false, timestamps: false })
export class UserPreferences {
  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: false })
  smsNotifications: boolean;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: 'light' })
  theme: string;
}

// Security audit subdocument
@Schema({ _id: false, timestamps: false })
export class SecurityAudit {
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop()
  userAgent?: string;

  @Prop()
  location?: string;
}

@Schema({
  timestamps: true,
  versionKey: 'schemaVersion', // Enable schema versioning
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never expose password
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      delete ret.securityAudit; // Sensitive security data
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
})
export class User {
  // Schema version for migrations
  @Prop({ default: 1, index: true })
  schemaVersion: number;

  // Personal Information
  @Prop({ 
    required: true, 
    trim: true, 
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z\s'-]+$/.test(v);
      },
      message: 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }
  })
  firstName: string;

  @Prop({ 
    required: true, 
    trim: true, 
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z\s'-]+$/.test(v);
      },
      message: 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }
  })
  lastName: string;

  @Prop({ 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    maxlength: [255, 'Email cannot exceed 255 characters'],
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    },
    index: { unique: true, background: true }
  })
  email: string;

  // Authentication
  @Prop({ 
    required: true, 
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Exclude by default for security
  })
  password: string;

  @Prop({ 
    type: String, 
    enum: {
      values: Object.values(UserRole),
      message: 'Invalid user role'
    },
    default: UserRole.Customer,
    index: true
  })
  role: UserRole;

  // Profile Information
  @Prop({ 
    type: String, 
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Profile image must be a valid image URL'
    }
  })
  profileImage?: string;

  @Prop({ 
    trim: true, 
    maxlength: [10, 'Phone number cannot exceed 10 characters'],
    validate: {
      validator: function(v: string) {
        return !v || /^\+?[\d\s-()]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  })
  phoneNumber?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ 
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    lowercase: true
  })
  gender?: string;

  // Account Status & Security
  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false, index: true })
  isDeleted: boolean; // Soft delete flag

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: String })
  deletedBy?: string; // User ID who deleted (for admin actions)

  @Prop({ default: false, index: true })
  isEmailVerified: boolean;

  @Prop({ type: String, select: false })
  emailVerificationToken?: string;

  @Prop({ type: Date, index: { expireAfterSeconds: 3600 } }) // TTL index
  emailVerificationExpiry?: Date;

  @Prop({ type: String, select: false })
  passwordResetToken?: string;

  @Prop({ type: Date, index: { expireAfterSeconds: 3600 } }) // TTL index
  passwordResetExpiry?: Date;

  // Session Management
  @Prop({ type: Date, index: true })
  lastLoginAt?: Date;

  @Prop({ type: String })
  lastLoginIp?: string;

  @Prop({ type: Number, default: 0 })
  loginAttempts: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[]; // Store active refresh tokens

  // Contact Information (Embedded addresses for better performance)
  @Prop({ type: [Address], default: [] })
  addresses: Address[];

  // User Preferences (Embedded for atomic updates)
  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences: UserPreferences;

  // Security Audit Trail (Limited size to prevent document bloat)
  @Prop({ 
    type: [SecurityAudit], 
    default: [],
    validate: {
      validator: function(v: SecurityAudit[]) {
        return v.length <= 50; // Limit to last 50 security events
      },
      message: 'Security audit trail cannot exceed 50 entries'
    },
    select: false
  })
  securityAudit: SecurityAudit[];

  // E-commerce specific fields
  @Prop({ type: Number, default: 0, min: 0 })
  totalOrders: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalSpent: number;

  @Prop({ type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' })
  loyaltyTier: string;

  @Prop({ type: Number, default: 0, min: 0 })
  loyaltyPoints: number;

  // Metadata
  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy?: string;

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// ============================================================================
// INDEXES FOR OPTIMAL PERFORMANCE
// ============================================================================

// Compound indexes for common query patterns
UserSchema.index({ role: 1, isActive: 1 }); // Admin queries for active users by role
UserSchema.index({ isActive: 1, isDeleted: 1 }); // Active non-deleted users
UserSchema.index({ createdAt: -1, role: 1 }); // Recent users by role
UserSchema.index({ totalSpent: -1, loyaltyTier: 1 }); // Customer analytics
UserSchema.index({ lastLoginAt: -1, isActive: 1 }); // Active users by last login
UserSchema.index({ 'addresses.isDefault': 1 }); // Find default addresses
UserSchema.index({ loyaltyTier: 1, loyaltyPoints: -1 }); // Loyalty program queries

// Text search index for user search functionality
UserSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text'
}, {
  weights: {
    email: 10,
    firstName: 5,
    lastName: 5
  },
  name: 'user_text_search'
});

// Sparse indexes for optional fields
UserSchema.index({ phoneNumber: 1 }, { sparse: true });
UserSchema.index({ deletedAt: 1 }, { sparse: true });

// ============================================================================
// SCHEMA MIDDLEWARE & VALIDATION
// ============================================================================

// Pre-save middleware for additional validation and data processing
UserSchema.pre('save', function(next) {
  // Ensure only one default address
  const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
  if (defaultAddresses.length > 1) {
    // Keep only the first default address
    this.addresses.forEach((addr, index) => {
      if (index > 0 && addr.isDefault) {
        addr.isDefault = false;
      }
    });
  }

  // Limit security audit to last 50 entries
  if (this.securityAudit.length > 50) {
    this.securityAudit = this.securityAudit.slice(-50);
  }

  // Update loyalty tier based on total spent
  if (this.totalSpent >= 10000) {
    this.loyaltyTier = 'platinum';
  } else if (this.totalSpent >= 5000) {
    this.loyaltyTier = 'gold';
  } else if (this.totalSpent >= 1000) {
    this.loyaltyTier = 'silver';
  } else {
    this.loyaltyTier = 'bronze';
  }

  next();
});

// Pre-update middleware for soft deletes
UserSchema.pre('findOneAndUpdate', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

UserSchema.pre('updateOne', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

UserSchema.pre('updateMany', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Pre-find middleware for soft deletes
UserSchema.pre('find', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

UserSchema.pre('findOne', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

UserSchema.pre('findOneAndDelete', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

UserSchema.pre('countDocuments', function() {
  // Only return non-deleted documents by default
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});

UserSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

UserSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault);
});

// ============================================================================
// STATIC METHODS FOR QUERY OPTIMIZATION
// ============================================================================

// Static method for lean queries (read-only operations)
UserSchema.statics.findLean = function(filter = {}, projection = null) {
  return this.find(filter, projection).lean({ virtuals: true });
};

// Static method for finding active users only
UserSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: { $ne: true } });
};

// Static method for soft delete
UserSchema.statics.softDelete = function(filter, deletedBy = null) {
  return this.updateMany(filter, {
    $set: {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
      ...(deletedBy && { deletedBy })
    }
  });
};

// Static method for user search with pagination
UserSchema.statics.searchUsers = function(searchTerm, options = {}) {
  const {
    role,
    isActive = true,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const filter: any = {
    isDeleted: { $ne: true },
    isActive
  };

  if (role) filter.role = role;
  
  if (searchTerm) {
    filter.$text = { $search: searchTerm };
  }

  const skip = (page - 1) * limit;

  return this.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean({ virtuals: true });
};

// ============================================================================
// PLUGINS
// ============================================================================

// Note: mongoose-lean-virtuals plugin removed due to TypeScript compatibility
// Lean queries with virtuals are achieved using .lean({ virtuals: true }) in static methods

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Export schema and subdocument schemas
export const AddressSchema = SchemaFactory.createForClass(Address);
export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);
export const SecurityAuditSchema = SchemaFactory.createForClass(SecurityAudit); 