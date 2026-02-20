package com.datahook.oms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Default IdentityProvider implementation.
 * Validates JWT tokens using:
 *   - HS256 (shared secret) for dev/testing
 *   - RS256 (public key / JWKS) for production
 *
 * Verifies: signature, expiration (exp), issuer (iss), audience (aud).
 * Extracts: sub → userId, role, email, name claims.
 */
@Component
@EnableConfigurationProperties(JwtProperties.class)
public class JwtIdentityProvider implements IdentityProvider {

    private final JwtProperties props;
    private SecretKey hmacKey;
    private PublicKey rsaPublicKey;

    public JwtIdentityProvider(JwtProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void init() {
        // If a shared secret is provided → HS256 mode (dev/testing)
        if (props.getSecret() != null && !props.getSecret().isBlank()) {
            byte[] keyBytes = Base64.getDecoder().decode(props.getSecret());
            this.hmacKey = new SecretKeySpec(keyBytes, "HmacSHA256");
        }
        // If JWKS URL or public key is set, RS256 is handled at verification time
        // For now, we support HS256 via secret and RS256 via DevTokenController's key injection
    }

    /**
     * Allow the DevTokenController to inject its generated public key at runtime.
     */
    public void setRsaPublicKey(PublicKey publicKey) {
        this.rsaPublicKey = publicKey;
    }

    @Override
    public AuthenticatedUser authenticate(String bearerToken) {
        Claims claims;

        if (rsaPublicKey != null) {
            // RS256 verification with public key
            claims = Jwts.parser()
                    .verifyWith(rsaPublicKey)
                    .requireIssuer(props.getIssuer())
                    .requireAudience(props.getAudience())
                    .build()
                    .parseSignedClaims(bearerToken)
                    .getPayload();
        } else if (hmacKey != null) {
            // HS256 verification with shared secret
            claims = Jwts.parser()
                    .verifyWith(hmacKey)
                    .requireIssuer(props.getIssuer())
                    .requireAudience(props.getAudience())
                    .build()
                    .parseSignedClaims(bearerToken)
                    .getPayload();
        } else {
            throw new SecurityException(
                "No JWT verification key configured. Set oms.security.jwt.secret or provide a public key.");
        }

        String userId = claims.getSubject();
        if (userId == null || userId.isBlank()) {
            throw new SecurityException("JWT missing 'sub' claim");
        }

        return new AuthenticatedUser(
                userId,
                claims.get("role", String.class) != null ? claims.get("role", String.class) : "CLIENT",
                claims.get("email", String.class),
                claims.get("name", String.class)
        );
    }
}
