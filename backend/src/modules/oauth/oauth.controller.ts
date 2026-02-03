import { Request, Response } from 'express';
import { oauthService } from '../../services/oauth.service';
import { generateToken, generateRefreshToken } from '../../utils/jwt';
import crypto from 'crypto';
import { createClient } from 'redis';

/**
 * OAuth Controller
 * Handles OAuth authentication flows with Redis-backed state storage
 */

// Redis client for OAuth state storage (production)
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
    },
  });

  redisClient.connect().catch((err: Error) => {
    console.error('OAuth Redis connection failed:', err);
    redisClient = null;
  });
}

// In-memory fallback for development
const stateStore = new Map<string, { createdAt: number; redirectUrl?: string; mode?: string }>();

// OAuth state storage functions
async function storeState(state: string, data: { createdAt: number; redirectUrl?: string; mode?: string }) {
  if (redisClient) {
    try {
      await redisClient.setEx(`oauth:state:${state}`, 600, JSON.stringify(data)); // 10 min expiry
    } catch (error) {
      console.error('Redis setEx failed, falling back to memory:', error);
      stateStore.set(state, data);
    }
  } else {
    stateStore.set(state, data);
  }
}

async function getState(state: string): Promise<{ createdAt: number; redirectUrl?: string; mode?: string } | null> {
  if (redisClient) {
    try {
      const data = await redisClient.get(`oauth:state:${state}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get failed, falling back to memory:', error);
      return stateStore.get(state) || null;
    }
  } else {
    return stateStore.get(state) || null;
  }
}

async function deleteState(state: string) {
  if (redisClient) {
    try {
      await redisClient.del(`oauth:state:${state}`);
    } catch (error) {
      console.error('Redis del failed:', error);
    }
  }
  stateStore.delete(state);
}

// Clean up expired in-memory states every 10 minutes (backup for dev)
setInterval(() => {
  const now = Date.now();
  const expirationTime = 10 * 60 * 1000; // 10 minutes
  
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > expirationTime) {
      stateStore.delete(state);
    }
  }
}, 10 * 60 * 1000);

class OAuthController {
  /**
   * Initiate Google OAuth flow
   * Generates authorization URL with CSRF protection
   */
  async initiateGoogleOAuth(req: Request, res: Response) {
    try {
      // Generate CSRF state token
      const state = crypto.randomBytes(32).toString('hex');
      const redirectUrl = req.query.redirect as string || '/dashboard';
      const mode = req.query.mode as string || 'login'; // 'login' or 'register'
      
      // Store state with timestamp and mode (Redis or memory)
      await storeState(state, {
        createdAt: Date.now(),
        redirectUrl,
        mode, // Store whether this is login or registration
      });

      // Get Google OAuth URL
      const authUrl = oauthService.getGoogleAuthUrl(state);

      res.json({
        authUrl,
        state, // Return to frontend for verification
      });
    } catch (error: any) {
      console.error('Google OAuth initiation failed:', error);
      res.status(500).json({
        error: 'Failed to initiate Google authentication',
        message: error.message,
      });
    }
  }

  /**
   * Handle Google OAuth callback
   * Exchanges code for tokens and creates/links user account
   */
  async handleGoogleCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      // Handle user cancellation
      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?error=oauth_cancelled&provider=google`
        );
      }

      // Validate required parameters
      if (!code || !state) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?error=invalid_oauth_response`
        );
      }

      // Verify CSRF state token
      const storedState = await getState(state as string);
      if (!storedState) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?error=invalid_state_token`
        );
      }

      // Delete used state token
      await deleteState(state as string);

      // Get client info for audit log
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] 
        || req.socket.remoteAddress 
        || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Verify Google token and get user info
      const userInfo = await oauthService.verifyGoogleToken(code as string);

      // Check mode: login vs register
      const mode = storedState.mode || 'login';

      let user, isNewUser;
      
      if (mode === 'register') {
        // Registration flow: create user if doesn't exist
        const result = await oauthService.findOrCreateOAuthUser(
          'google',
          userInfo,
          ipAddress,
          userAgent
        );
        user = result.user;
        isNewUser = result.isNewUser;
      } else {
        // Login flow: only allow existing users
        const result = await oauthService.loginWithOAuth(
          'google',
          userInfo,
          ipAddress,
          userAgent
        );
        user = result.user;
        isNewUser = false;
      }

      // Generate JWT tokens for our app
      const accessToken = generateToken(user.id.toString(), user.role);
      const refreshToken = generateRefreshToken(user.id.toString());

      // Redirect to frontend OAuth callback handler
      // The callback handler will store tokens and redirect to the final destination
      const frontendUrl = new URL('/auth/callback', process.env.FRONTEND_URL);
      frontendUrl.searchParams.set('token', accessToken);
      frontendUrl.searchParams.set('refresh_token', refreshToken);
      frontendUrl.searchParams.set('new_user', isNewUser.toString());

      res.redirect(frontendUrl.toString());
    } catch (error: any) {
      console.error('Google OAuth callback failed:', error);
      
      // Handle "account not found" error specifically
      if (error.message === 'NO_ACCOUNT_FOUND') {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?error=no_account&message=${encodeURIComponent('Account not found. Please register first.')}`
        );
      }
      
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?error=oauth_failed&provider=google&message=${encodeURIComponent(error.message)}`
      );
    }
  }

  /**
   * Initiate Microsoft OAuth flow (Future Implementation)
   */
  async initiateMicrosoftOAuth(req: Request, res: Response) {
    res.status(501).json({
      error: 'Microsoft OAuth not yet implemented',
      message: 'Coming soon',
    });
  }

  /**
   * Handle Microsoft OAuth callback (Future Implementation)
   */
  async handleMicrosoftCallback(req: Request, res: Response) {
    res.status(501).json({
      error: 'Microsoft OAuth not yet implemented',
      message: 'Coming soon',
    });
  }

  /**
   * Get connected OAuth providers for current user
   * Requires authentication
   */
  async getConnectedProviders(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { OAuthAccount } = await import('../../models/oauth.model');
      
      const connectedAccounts = await OAuthAccount.find({
        userId,
        isActive: true,
      }).select('provider email lastLogin createdAt');

      res.json({
        providers: connectedAccounts.map(account => ({
          provider: account.provider,
          email: account.email,
          connectedAt: (account as any).createdAt,
          lastUsed: account.lastLogin,
        })),
      });
    } catch (error: any) {
      console.error('Failed to get connected providers:', error);
      res.status(500).json({
        error: 'Failed to retrieve connected providers',
        message: error.message,
      });
    }
  }

  /**
   * Disconnect OAuth provider
   * Requires authentication
   */
  async disconnectProvider(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { provider } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!['google', 'microsoft', 'okta'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      await oauthService.revokeOAuthAccess(
        userId,
        provider as 'google' | 'microsoft' | 'okta'
      );

      res.json({
        message: `${provider} account disconnected successfully`,
      });
    } catch (error: any) {
      console.error('Failed to disconnect provider:', error);
      res.status(400).json({
        error: 'Failed to disconnect provider',
        message: error.message,
      });
    }
  }
}

export const oauthController = new OAuthController();
