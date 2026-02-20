package com.datahook.oms.security;

/**
 * Represents the authenticated user extracted from a JWT token.
 * This is NOT a JPA entity — never stored in the database.
 */
public record AuthenticatedUser(
    String userId,    // from JWT "sub" claim
    String role,      // from JWT "role" claim — "ADMIN" or "CLIENT"
    String email,     // from JWT "email" claim
    String name       // from JWT "name" claim
) {
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
