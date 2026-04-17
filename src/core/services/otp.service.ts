import crypto from "crypto";
import { FonnteResponse, OTPDTO, OTPMessageDTO, ResendOTPDTO, SessionDTO } from '../types';
import jwt, { SignOptions } from 'jsonwebtoken';
import { usersQueries } from '../../db/queries/users.queries';

type OtpSession = {
    phoneNumber: string;
    otp: string;
    expires: number;
};

const otpSessions = new Map<string, OtpSession>();


export class OTPService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || '';
    private readonly JWT_EXPIRES_IN: SignOptions['expiresIn'] =
        process.env.JWT_EXPIRES_IN
            ? Number(process.env.JWT_EXPIRES_IN)
            : 60 * 60 * 24 * 7;

    private generateToken(userId: number, role: string): string {
        const payload = { userId, role };

        const options: SignOptions = {
            expiresIn: this.JWT_EXPIRES_IN,
        };

        return jwt.sign(payload, this.JWT_SECRET, options);
    }

    generateSession(credentials: SessionDTO) {

        const { phoneNumber } = credentials;
        const sessionId = crypto.randomUUID();

        const isBypass = phoneNumber === process.env.BYPASS_OTP_NUMBER;

        const otp = isBypass
            ? process.env.BYPASS_OTP_CODE!
            : Math.floor(1000 + Math.random() * 9000).toString();

        const expires = Date.now() + 5 * 60 * 1000;

        otpSessions.set(sessionId, {
            phoneNumber,
            otp,
            expires: expires
        });

        console.log("Generated:\n" + "OTP: \x1b[32m", otp, "\x1b[0m PhoneNumber: \x1b[32m", phoneNumber, "\x1b[0m")
        return { phoneNumber, sessionId, otp, expires };
    }

    createSession(credentials: SessionDTO) {
        const { phoneNumber } = credentials;
        const { sessionId, otp, expires } = this.generateSession(credentials);

        if (phoneNumber != process.env.BYPASS_OTP_NUMBER) {
            this.sendOtp({
                phoneNumber: phoneNumber,
                otp: otp,
            })
        }

        return { sessionId, expires };
    }

    async resendSession(credentials: ResendOTPDTO) {
        const { sessionId: sessionIdOld } = credentials;
        const old = otpSessions.get(sessionIdOld);
        if (!old) throw new Error("Session not found");

        otpSessions.delete(sessionIdOld);

        const { phoneNumber, sessionId: sessionIdNew, otp, expires } = this.generateSession({ phoneNumber: old.phoneNumber })

        if (phoneNumber != process.env.BYPASS_OTP_NUMBER) {
            this.sendOtp({
                phoneNumber: phoneNumber,
                otp: otp,
            })
        }

        return { phoneNumber, sessionId: sessionIdNew, expires };
    }

    async verify(credentials: OTPDTO) {

        const { sessionId, otp } = credentials;
        const session = otpSessions.get(sessionId);

        // console.log("Session: ", session);
        console.log("Expires: ", new Date(session?.expires ?? 0).toLocaleString());
        if (!session) throw new Error("Invalid session");

        if (Date.now() > session.expires) {
            otpSessions.delete(sessionId);
            throw new Error("OTP expired");
        }

        if (session.otp !== otp) {
            throw new Error("Invalid OTP");
        }

        const user = await usersQueries.findByPhoneNumber(session.phoneNumber);
        const token = this.generateToken(user!.id, user!.role);

        // console.log("Token: ", token,"User: ", user)

        otpSessions.delete(sessionId);

        return { token, user };
    }

    async sendOtp(credentials: OTPMessageDTO) {
        const { phoneNumber, otp } = credentials;
        const cleanPhone = phoneNumber.replace("+", "");
        const payload = {
            method: "POST",
            headers: {
                Authorization: process.env.FONNTE_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                target: cleanPhone,
                message: `*${otp}* is your verification code.

This code will expire in 5 minutes.
For security, do not share it.`
            }),
        }
        // console.log("Payload: ", payload);
        const res = await fetch("https://api.fonnte.com/send", payload);

        const data = await res.json() as FonnteResponse;

        // console.log("Fonnte response:", data);

        if (!data.status) {
            throw new Error("Failed to send OTP: " + JSON.stringify(data));
        }

        return true;
    }
}

export const otpService = new OTPService();
