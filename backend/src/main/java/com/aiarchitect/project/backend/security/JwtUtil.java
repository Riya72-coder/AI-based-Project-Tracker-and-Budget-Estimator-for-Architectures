package com.aiarchitect.project.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {

    private static final String SECRET = "mysecretkeymysecretkeymysecretkey123";
    private static final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    // 🔥 GENERATE TOKEN WITH ROLE
    public static String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key)
                .compact();
    }

    // 🔥 COMMON CLAIMS METHOD (NEW - SAFE ADD)
    private static Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 🔥 GET EMAIL
    public static String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // 🔥 GET ROLE
    public static String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // 🔥 TOKEN VALIDATION (BONUS - USEFUL)
    public static boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}