package com.riva.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtils {

    @Value("${riva.jwt.secret}")
    private String jwtSecret;

    @Value("${riva.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        return generateToken(authentication, TenantContext.DEFAULT_TENANT, "DEFAULT");
    }

    public String generateToken(Authentication authentication, String tenantSchema, String storeCode) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantSchema", tenantSchema != null ? tenantSchema : TenantContext.DEFAULT_TENANT);
        claims.put("storeCode", storeCode != null ? storeCode : "DEFAULT");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public String getTenantSchemaFromToken(String token) {
        Claims claims = parseClaims(token);
        String tenantSchema = claims.get("tenantSchema", String.class);
        return tenantSchema != null ? tenantSchema : TenantContext.DEFAULT_TENANT;
    }

    public String getStoreCodeFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("storeCode", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
