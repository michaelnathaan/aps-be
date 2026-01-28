import { User, UserDashboard, LoginDTO, AuthResponse } from '../../core/types';
import { NotFoundError, UnauthorizedError } from '../../core/errors/custom-errors';
import { usersQueries } from '../../db/queries/users.queries';
import { bookingsQueries } from '../../db/queries/bookings.queries';
import jwt, { SignOptions } from "jsonwebtoken";
import { startOfDay, isFuture } from 'date-fns';

/**
 * Handles user authentication and dashboard logic.
 * Shared by both REST and GraphQL implementations.
 */
export class UserService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || '';
    private readonly JWT_EXPIRES_IN: SignOptions['expiresIn'] =
        process.env.JWT_EXPIRES_IN
            ? Number(process.env.JWT_EXPIRES_IN)
            : 60 * 60 * 24 * 7;


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
    async login(credentials: LoginDTO): Promise<AuthResponse> {
        const { phoneNumber } = credentials;

        const user = await usersQueries.findByPhoneNumber(phoneNumber);

        if (!user) {
            throw new UnauthorizedError('Invalid phone number');
        }

        const token = this.generateToken(user.id, user.role);

        return {
            token,
            user
        };
    }

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
    async getUserDashboard(userId: number): Promise<UserDashboard> {
        const user = await this.getUserById(userId);

        const bookings = await bookingsQueries.findByUserId(userId);

        const today = startOfDay(new Date());

        const bookingCountToday = bookings.filter(b => {
            const bookingDay = startOfDay(new Date(b.bookingDate));
            return bookingDay.getTime() === today.getTime() &&
                (b.status === 'pending' || b.status === 'confirmed');
        }).length;

        const upcomingBookings = bookings.filter(b => {
            const bookingDate = new Date(b.bookingDate);
            return isFuture(bookingDate) &&
                (b.status === 'pending' || b.status === 'confirmed');
        }).length;

        const totalSpent = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + b.totalPrice, 0);

        return {
            user,
            bookings,
            bookingCountToday,
            upcomingBookings,
            totalSpent
        };
    }

    private generateToken(userId: number, role: string): string {
        const payload = { userId, role };

        const options: SignOptions = {
            expiresIn: this.JWT_EXPIRES_IN,
        };

        return jwt.sign(payload, this.JWT_SECRET, options);
    }


    decodeToken(token: string): { userId: number; role: string } | null {
        try {
            return jwt.decode(token) as { userId: number; role: string };
        } catch {
            return null;
        }
    }
}

export const userService = new UserService();