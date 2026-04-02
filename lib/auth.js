import 'server-only';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const COOKIE_NAME = 'tnpkarma_session';

// Admin credentials — ID can fallback, but password must be strictly in env
// to prevent source-code leaks. Ensure ADMIN_PASSWORD is set in .env.local.
const ADMIN_ID = process.env.ADMIN_ID || 'karmaboss';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Dedicated admin verification — compares plaintext directly, no env hash needed
export function verifyAdmin(rollNumber, password) {
    return rollNumber === ADMIN_ID && password === ADMIN_PASSWORD;
}

export function createToken(payload, rememberMe = false) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: rememberMe ? '30d' : '1d',
    });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// Server-side: get session from cookies (use in Route Handlers)
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

export { COOKIE_NAME };
