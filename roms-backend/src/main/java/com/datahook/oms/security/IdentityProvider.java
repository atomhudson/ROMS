package com.datahook.oms.security;

/**
 * Pluggable identity provider interface.
 * The OMS does not own user data — it delegates authentication
 * to an external identity provider via this interface.
 *
 * Default implementation: JwtIdentityProvider (RS256/JWKS).
 * Replace this bean to integrate with any auth system.
 */
public interface IdentityProvider {

    /**
     * Validate a bearer token and extract user claims.
     *
     * @param bearerToken the raw JWT token (without "Bearer " prefix)
     * @return authenticated user with userId, role, email, name
     * @throws RuntimeException if token is invalid, expired, or untrusted
     */
    AuthenticatedUser authenticate(String bearerToken);
}
