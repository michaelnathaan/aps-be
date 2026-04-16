import { User, UserDashboard, LoginDTO, CreateUserDTO, UpdateUserDTO, OTPSessionResponse } from '../../core/types';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../core/errors/custom-errors';
import { usersQueries } from '../../db/queries/users.queries';
import { bookingsQueries } from '../../db/queries/bookings.queries';
import jwt from "jsonwebtoken";
import { otpService } from './otp.service';

/**
 * Handles user authentication and dashboard logic.
 * Shared by both REST and GraphQL implementations.
 */
export class UserService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || '';
    // private readonly JWT_EXPIRES_IN: SignOptions['expiresIn'] =
    //     process.env.JWT_EXPIRES_IN
    //         ? Number(process.env.JWT_EXPIRES_IN)
    //         : 60 * 60 * 24 * 7;


    async getUserById(id: number): Promise<User> {
        const user = await usersQueries.findById(id);
        if (!user) {
            throw new NotFoundError('User', id);
        }
        return user;
    }

    async getUsersByIds(ids: number[]): Promise<User[]> {
        return await usersQueries.findByIds(ids);
    }

    /**
     * Simple authentication (phone number only for MVP)
     * In production: add password/OTP verification
     */
    // async login(credentials: LoginDTO): Promise<AuthResponse> {
    //     const { phoneNumber } = credentials;

    //     const user = await usersQueries.findByPhoneNumber(phoneNumber);

    //     if (!user) {
    //         throw new UnauthorizedError('Invalid phone number');
    //     }

    //     const token = this.generateToken(user.id, user.role);

    //     return {
    //         token,
    //         user
    //     };
    // }

    // Login OTP flow
    async login(credentials: LoginDTO): Promise<OTPSessionResponse> {
        const { phoneNumber } = credentials;

        const user = await usersQueries.findByPhoneNumber(phoneNumber);

        if (!user) {
            throw new UnauthorizedError('Invalid phone number');
        }

        const { sessionId, expires } = otpService.createSession(credentials)


        return {
            sessionId,
            expires
        };
    }
    // End of login OTP flow

    async verifyToken(token: string): Promise<User> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number; role: string };
            return await this.getUserById(decoded.userId);
        } catch (error) {
            throw new UnauthorizedError('Invalid or expired token');
        }
    }

    /**
     * Returns:
     * - User info
     * - All bookings (past and future)
     * - Booking count today
     * - Upcoming bookings count
     * - Total amount spent
     */
    async getUserDashboard(
        userId: number,
        limit: number,
        offset: number
    ): Promise<UserDashboard> {
        const user = await this.getUserById(userId);

        const [stats, bookings] = await Promise.all([
            bookingsQueries.getUserDashboardStats(userId),
            bookingsQueries.findByUserIdPaginated(userId, limit, offset),
        ]);

        return {
            user,
            bookings,
            bookingCountToday: stats.bookingCountToday,
            upcomingBookings: stats.upcomingBookings,
            totalSpent: stats.totalSpent,
        };
    }

    // private generateToken(userId: number, role: string): string {
    //     const payload = { userId, role };

    //     const options: SignOptions = {
    //         expiresIn: this.JWT_EXPIRES_IN,
    //     };

    //     return jwt.sign(payload, this.JWT_SECRET, options);
    // }


    decodeToken(token: string): { userId: number; role: string } | null {
        try {
            return jwt.decode(token) as { userId: number; role: string };
        } catch {
            return null;
        }
    }

    async getAllUsers(): Promise<User[]> {
        return await usersQueries.findAll();
    }

    async createUser(data: CreateUserDTO): Promise<User> {
        const existing = await usersQueries.findByPhoneNumber(data.phoneNumber);
        if (existing) {
            throw new ConflictError(`Phone number ${data.phoneNumber} is already registered`);
        }
        return await usersQueries.create(data);
    }

    async updateUser(id: number, data: UpdateUserDTO): Promise<User> {
        await this.getUserById(id); // ensures user exists, throws NotFoundError if not
        if (data.phoneNumber) {
            const existing = await usersQueries.findByPhoneNumber(data.phoneNumber);
            if (existing && existing.id !== id) {
                throw new ConflictError(`Phone number ${data.phoneNumber} is already registered`);
            }
        }
        const updated = await usersQueries.update(id, data);
        if (!updated) throw new NotFoundError('User', id);
        return updated;
    }

    async deleteUser(id: number): Promise<boolean> {
        await this.getUserById(id);
        return await usersQueries.delete(id);
    }
}

export const userService = new UserService();