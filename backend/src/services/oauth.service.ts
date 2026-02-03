import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { User } from '../modules/auth/auth.model';
import { OAuthAccount } from '../models/oauth.model';
import { AuthLog } from '../models/auth-log.model';
import mongoose from 'mongoose';

/**
 * OAuth Service
 * Handles authentication with external OAuth providers
 * Supports: Google, Microsoft (future), Okta (future)
 */

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  locale?: string;
}

export class OAuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate Google OAuth URL
   * CSRF protection using state parameter
   */
  getGoogleAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      state: state, // CSRF token
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Verify Google ID Token
   * Returns user information from Google
   */
  async verifyGoogleToken(code: string): Promise<OAuthUserInfo> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.googleClient.getToken(code);
      this.googleClient.setCredentials(tokens);

      // Verify the ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        providerId: payload.sub,
        email: payload.email!,
        emailVerified: payload.email_verified || false,
        name: payload.name || '',
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
        locale: payload.locale,
      };
    } catch (error: any) {
      console.error('Google token verification failed:', error);
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  /**
   * Find or Create User from OAuth Login
   * Handles account linking for same email addresses
   */
  async findOrCreateOAuthUser(
    provider: 'google' | 'microsoft' | 'okta',
    userInfo: OAuthUserInfo,
    ipAddress: string,
    userAgent: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if OAuth account already exists
      let oauthAccount = await OAuthAccount.findOne({
        provider,
        providerId: userInfo.providerId,
      }).session(session);

      let user;
      let isNewUser = false;

      if (oauthAccount) {
        // Existing OAuth account - get user
        user = await User.findById(oauthAccount.userId).session(session);
        
        if (!user || !user.isActive) {
          throw new Error('User account is inactive or not found');
        }

        // Update last login
        oauthAccount.lastLogin = new Date();
        await oauthAccount.save({ session });
      } else {
        // New OAuth login - check if user exists with this email
        user = await User.findOne({ 
          email: userInfo.email.toLowerCase() 
        }).session(session);

        if (user) {
          // Account linking - existing user, add OAuth account
          if (!user.isActive) {
            throw new Error('User account is inactive');
          }

          console.log(`Linking ${provider} account to existing user: ${user.email}`);
          
          // Update user's auth method if they were email/password only
          if (user.authMethod === 'email_password') {
            user.authMethod = 'oauth';
          }
        } else {
          // New user - create account
          isNewUser = true;
          user = new User({
            name: userInfo.name,
            email: userInfo.email.toLowerCase(),
            emailVerified: userInfo.emailVerified,
            authMethod: 'oauth',
            avatar: userInfo.picture,
            isActive: true,
            workspaceId: `workspace_${Date.now()}`,
            role: 'user',
          });

          await user.save({ session });
          console.log(`Created new user from ${provider} OAuth: ${user.email}`);
        }

        // Create OAuth account record
        oauthAccount = new OAuthAccount({
          userId: user._id,
          provider,
          providerId: userInfo.providerId,
          email: userInfo.email.toLowerCase(),
          name: userInfo.name,
          picture: userInfo.picture,
          lastLogin: new Date(),
          isActive: true,
        });

        await oauthAccount.save({ session });
      }

      // Update user last login
      user.lastLogin = new Date();
      user.failedLoginAttempts = 0; // Reset failed attempts
      user.accountLockedUntil = undefined;
      
      if (!user.emailVerified && userInfo.emailVerified) {
        user.emailVerified = true;
      }
      
      await user.save({ session });

      await session.commitTransaction();

      // Log authentication event (outside transaction - time-series collections don't support transactions)
      await AuthLog.create({
        userId: user._id,
        email: user.email,
        eventType: 'oauth_login_success',
        authMethod: provider,
        ipAddress,
        userAgent,
        metadata: {
          isNewUser,
          accountLinked: !!oauthAccount && !isNewUser,
        },
        timestamp: new Date(),
      });

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        isNewUser,
      };
    } catch (error: any) {
      await session.abortTransaction();
      
      // Log failed login attempt
      await AuthLog.create({
        email: userInfo.email,
        eventType: 'oauth_login_failed',
        authMethod: provider,
        ipAddress,
        userAgent,
        metadata: {
          reason: error.message,
        },
        timestamp: new Date(),
      });

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Login with OAuth (Login flow - only existing users)
   * Rejects if user doesn't exist
   */
  async loginWithOAuth(
    provider: 'google' | 'microsoft' | 'okta',
    userInfo: OAuthUserInfo,
    ipAddress: string,
    userAgent: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if OAuth account already exists
      let oauthAccount = await OAuthAccount.findOne({
        provider,
        providerId: userInfo.providerId,
      }).session(session);

      let user;

      if (oauthAccount) {
        // Existing OAuth account - get user
        user = await User.findById(oauthAccount.userId).session(session);
        
        if (!user || !user.isActive) {
          throw new Error('User account is inactive or not found');
        }

        // Update last login
        oauthAccount.lastLogin = new Date();
        await oauthAccount.save({ session });
      } else {
        // Check if user exists with this email
        user = await User.findOne({ 
          email: userInfo.email.toLowerCase() 
        }).session(session);

        if (!user) {
          // User doesn't exist - reject login
          throw new Error('NO_ACCOUNT_FOUND');
        }

        if (!user.isActive) {
          throw new Error('User account is inactive');
        }

        // Account linking - existing user, add OAuth account
        console.log(`Linking ${provider} account to existing user: ${user.email}`);
        
        // Update user's auth method if they were email/password only
        if (user.authMethod === 'email_password') {
          user.authMethod = 'oauth';
        }

        // Create OAuth account record
        oauthAccount = new OAuthAccount({
          userId: user._id,
          provider,
          providerId: userInfo.providerId,
          email: userInfo.email.toLowerCase(),
          name: userInfo.name,
          picture: userInfo.picture,
          lastLogin: new Date(),
          isActive: true,
        });

        await oauthAccount.save({ session });
      }

      // Update user last login
      user.lastLogin = new Date();
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = undefined;
      
      if (!user.emailVerified && userInfo.emailVerified) {
        user.emailVerified = true;
      }
      
      await user.save({ session });

      await session.commitTransaction();

      // Log authentication event (outside transaction - time-series collections don't support transactions)
      await AuthLog.create({
        userId: user._id,
        email: user.email,
        eventType: 'oauth_login_success',
        authMethod: provider,
        ipAddress,
        userAgent,
        metadata: {
          isNewUser: false,
          accountLinked: true,
        },
        timestamp: new Date(),
      });

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        isNewUser: false,
      };
    } catch (error: any) {
      await session.abortTransaction();
      
      // Log failed login attempt
      if (error.message === 'NO_ACCOUNT_FOUND') {
        await AuthLog.create({
          email: userInfo.email,
          eventType: 'oauth_login_failed',
          authMethod: provider,
          ipAddress,
          userAgent,
          success: false,
          metadata: {
            reason: 'Account not found',
          },
          timestamp: new Date(),
        });
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Revoke OAuth Access
   * Called when user disconnects OAuth provider
   */
  async revokeOAuthAccess(
    userId: string,
    provider: 'google' | 'microsoft' | 'okta'
  ): Promise<void> {
    const oauthAccount = await OAuthAccount.findOne({
      userId,
      provider,
    });

    if (!oauthAccount) {
      throw new Error('OAuth account not found');
    }

    // Mark as inactive instead of deleting (audit trail)
    oauthAccount.isActive = false;
    await oauthAccount.save();

    // If user has no other auth methods, prevent revocation
    const user = await User.findById(userId);
    const otherOAuthAccounts = await OAuthAccount.countDocuments({
      userId,
      isActive: true,
      _id: { $ne: oauthAccount._id },
    });

    if (!user?.password && otherOAuthAccounts === 0) {
      throw new Error(
        'Cannot disconnect last authentication method. Please set a password first.'
      );
    }
  }

  /**
   * Future: Add Microsoft OAuth support
   */
  async verifyMicrosoftToken(code: string): Promise<OAuthUserInfo> {
    // TODO: Implement Microsoft OAuth
    throw new Error('Microsoft OAuth not yet implemented');
  }

  /**
   * Future: Add Okta OAuth support
   */
  async verifyOktaToken(code: string): Promise<OAuthUserInfo> {
    // TODO: Implement Okta OAuth
    throw new Error('Okta OAuth not yet implemented');
  }
}

export const oauthService = new OAuthService();
